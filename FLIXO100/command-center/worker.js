/**
 * FLIXO 1000 AI — Cloudflare Worker API.
 *
 * Required Worker secrets/variables:
 *   FLIXO_OWNER_TOKEN (secret, long random token)
 *   FLIXO_AI_API_URL   (variable, e.g. https://api.openai.com/v1/responses)
 *   FLIXO_AI_API_KEY   (secret)
 *   FLIXO_AI_MODEL     (variable supported by provider)
 * Optional:
 *   FLIXO_ALLOWED_ORIGINS (comma-separated exact origins; same-origin requests always allowed)
 *
 * Never place secrets in browser code or Git.
 */
import { planOwnerCommand, runApprovedAssignment } from "../director.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const MAX_BODY = 12000;
function newId() { return crypto.randomUUID(); }
function cleanText(value, max = 2000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}
async function readJson(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new Error("Request body is too large.");
  return raw ? JSON.parse(raw) : {};
}
function requireDb(env) {
  if (!env.FLIXO_DB) throw new Error("database_not_configured");
  return env.FLIXO_DB;
}
async function crmRoute(request, env, url, respond) {
  const db = requireDb(env);
  const method = request.method;
  const path = url.pathname;

  if (path === "/api/customers" && method === "POST") {
    const body = await readJson(request);
    const fullName = cleanText(body.fullName, 200);
    const email = cleanText(body.email, 320).toLowerCase();
    const phone = cleanText(body.phone, 40);
    if (!fullName || (!email && !phone)) return respond({ ok:false, error:"fullName and at least one of email or phone are required." },400);
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond({ ok:false, error:"Invalid email address." },400);
    const id = newId();
    await db.prepare("INSERT INTO customers (id, full_name, email, phone, company, country_code, consent_status, source) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id,fullName,email||null,phone||null,cleanText(body.company,200)||null,cleanText(body.countryCode,2).toUpperCase()||null,
        ["unknown","granted","withdrawn"].includes(body.consentStatus) ? body.consentStatus : "unknown",
        ["web","referral","partner","direct","import"].includes(body.source) ? body.source : "direct").run();
    return respond({ ok:true, id, created:true },201);
  }

  if (path === "/api/customers" && method === "GET") {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25),1),100);
    const q = cleanText(url.searchParams.get("q") || "",120);
    const rows = await db.prepare("SELECT id,full_name,email,phone,company,country_code,consent_status,source,created_at FROM customers WHERE (?='' OR full_name LIKE '%'||?||'%' OR email LIKE '%'||?||'%' OR company LIKE '%'||?||'%') ORDER BY created_at DESC LIMIT ?")
      .bind(q,q,q,q,limit).all();
    return respond({ ok:true, customers:rows.results || [], limit });
  }

  if (path === "/api/leads" && method === "POST") {
    const body = await readJson(request);
    const need = cleanText(body.needSummary, 4000);
    if (!need) return respond({ ok:false, error:"needSummary is required." }, 400);
    const id = newId();
    const customerId = body.customerId ? cleanText(body.customerId, 80) : null;
    const consent = body.consentToContact === true ? 1 : 0;
    await db.prepare("INSERT INTO leads (id, customer_id, company, need_summary, source, consent_to_contact) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(id, customerId, cleanText(body.company, 200) || null, need,
        ["web","referral","partner","direct","import"].includes(body.source) ? body.source : "web", consent).run();
    return respond({ ok:true, id, status:"new", contactActionTaken:false }, 201);
  }

  if (path === "/api/leads" && method === "GET") {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25),1),100);
    const status = url.searchParams.get("status");
    const q = cleanText(url.searchParams.get("q") || "", 120);
    const rows = await db.prepare(`SELECT l.id,l.customer_id,l.company,l.need_summary,l.source,l.status,l.score,l.next_action,l.consent_to_contact,l.created_at,c.full_name,c.email,c.phone FROM leads l LEFT JOIN customers c ON c.id=l.customer_id WHERE (? IS NULL OR l.status=?) AND (?='' OR l.company LIKE '%'||?||'%' OR l.need_summary LIKE '%'||?||'%') ORDER BY l.created_at DESC LIMIT ?`)
      .bind(status,status,q,q,q,limit).all();
    return respond({ ok:true, leads:rows.results || [], limit });
  }

  if (path === "/api/orders" && method === "POST") {
    const body = await readJson(request);
    const customerId = cleanText(body.customerId, 80);
    const description = cleanText(body.description, 4000);
    const amount = Number(body.amountMinor);
    const currency = cleanText(body.currency || "USD", 3).toUpperCase();
    if (!customerId || !description || !Number.isSafeInteger(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currency))
      return respond({ ok:false, error:"customerId, description, non-negative integer amountMinor and 3-letter currency are required." },400);
    const id = newId();
    await db.batch([
      db.prepare("INSERT INTO orders (id, customer_id, lead_id, description, amount_minor, currency, status) VALUES (?, ?, ?, ?, ?, ?, 'received')")
        .bind(id,customerId,cleanText(body.leadId,80)||null,description,amount,currency),
      db.prepare("INSERT INTO order_events (id, order_id, event_type, actor, details_json) VALUES (?, ?, 'created', 'owner_api', ?)")
        .bind(newId(),id,JSON.stringify({source:"api"}))
    ]);
    return respond({ ok:true, id, status:"received", paymentStatus:"not_started" },201);
  }

  if (path === "/api/orders" && method === "GET") {
    const limit = Math.min(Math.max(Number(url.searchParams.get("limit") || 25),1),100);
    const status = url.searchParams.get("status");
    const rows = await db.prepare("SELECT o.*,c.full_name,c.email FROM orders o JOIN customers c ON c.id=o.customer_id WHERE (? IS NULL OR o.status=?) ORDER BY o.created_at DESC LIMIT ?")
      .bind(status,status,limit).all();
    return respond({ ok:true, orders:rows.results || [], limit });
  }

  if (path === "/api/revenue/ledger" && method === "GET") {
    const start = url.searchParams.get("start") || "1970-01-01T00:00:00Z";
    const end = url.searchParams.get("end") || "9999-12-31T23:59:59Z";
    const rows = await db.prepare("SELECT kind,currency,SUM(amount_minor) AS amount_minor,COUNT(*) AS entries FROM revenue_transactions WHERE occurred_at>=? AND occurred_at<=? GROUP BY kind,currency ORDER BY currency,kind")
      .bind(start,end).all();
    return respond({ ok:true, ledger:rows.results || [], note:"Only provider-confirmed financial events should be recorded." });
  }

  return null;
}


function json(data, status = 200, cors = {}) {
  return new Response(JSON.stringify(data), { status, headers: { ...JSON_HEADERS, ...cors } });
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  if (!origin) return {};
  const requestOrigin = new URL(request.url).origin;
  const allowed = new Set(
    String(env.FLIXO_ALLOWED_ORIGINS || "")
      .split(",").map(v => v.trim()).filter(Boolean)
  );
  if (origin !== requestOrigin && !allowed.has(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Max-Age": "600"
  };
}

function authorized(request, env) {
  const expected = env.FLIXO_OWNER_TOKEN;
  const supplied = request.headers.get("Authorization") || "";
  return typeof expected === "string" && expected.length >= 32 &&
    supplied.startsWith("Bearer ") && supplied.slice(7) === expected;
}

async function readBody(request) {
  const raw = await request.text();
  if (raw.length > MAX_BODY) throw new Error("Request body is too large.");
  return JSON.parse(raw);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (cors === null) return json({ ok: false, error: "Origin not allowed." }, 403);
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: { ...cors, ...JSON_HEADERS } });
    }

    const respond = (data, status = 200) => json(data, status, cors);
    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return respond({
        ok: true,
        service: "FLIXO Command Center API",
        aiConfigured: Boolean((env.FLIXO_AI_API_KEY || env.FLIXO_AI_KEY) && (env.FLIXO_AI_API_URL || "https://api.openai.com/v1/responses") && (env.FLIXO_AI_MODEL || "gpt-5.4-mini")),
        ownerAuthConfigured: Boolean(env.FLIXO_OWNER_TOKEN && env.FLIXO_OWNER_TOKEN.length >= 32)
      });
    }

    const crmPath = ["/api/customers", "/api/leads", "/api/orders", "/api/revenue/ledger"].includes(url.pathname);
    const crmMethod = ["GET", "POST"].includes(request.method);
    if (crmPath && crmMethod) {
      if (!authorized(request, env)) return respond({ ok:false, error:"Owner authorization required." },401);
      try {
        const result = await crmRoute(request, env, url, respond);
        return result || respond({ ok:false, error:"Not found." },404);
      } catch (error) {
        const message = String(error?.message || error);
        return respond({ ok:false, error:message === "database_not_configured" ? "D1 binding FLIXO_DB is not configured." : message }, message === "database_not_configured" ? 503 : 400);
      }
    }

    if (request.method !== "POST" || !["/api/command", "/api/execute"].includes(url.pathname)) {
      return respond({ ok: false, error: "Not found." }, 404);
    }
    if (!authorized(request, env)) return respond({ ok: false, error: "Owner authorization required." }, 401);
    if (!env.FLIXO_AI_API_URL || !env.FLIXO_AI_API_KEY || !env.FLIXO_AI_MODEL) {
      return respond({ ok: false, status: "brain_not_configured", error: "AI provider secrets/configuration are missing." }, 503);
    }

    try {
      const body = await readBody(request);
      if (url.pathname === "/api/command") {
        const result = await planOwnerCommand({
          command: body.command,
          language: body.language || "ru",
          env
        });
        return respond(result, result.ok ? 200 : 502);
      }

      const result = await runApprovedAssignment({
        approval: body.approval === true,
        specialistId: body.specialistId,
        brief: body.brief,
        language: body.language || "ru",
        env
      });
      return respond(result, result.ok ? 200 : 400);
    } catch (error) {
      return respond({ ok: false, status: "request_error", error: String(error?.message || error) }, 400);
    }
  }
};
