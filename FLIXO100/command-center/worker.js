/**
 * FLIXO 1000 AI — Cloudflare Worker API.
 *
 * Required Worker secrets/variables:
 *   FLIXO_OWNER_TOKEN (secret, long random token)
 *   FLIXO_AI_API_URL   (variable, e.g. https://api.openai.com/v1/chat/completions)
 *   FLIXO_AI_API_KEY   (secret)
 *   FLIXO_AI_MODEL     (variable supported by provider)
 * Optional:
 *   FLIXO_ALLOWED_ORIGINS (comma-separated exact origins; same-origin requests always allowed)
 *
 * Never place secrets in browser code or Git.
 */
import { planOwnerCommand, runApprovedAssignment } from "./director.js";

const JSON_HEADERS = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
const MAX_BODY = 12000;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
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
    "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const url = new URL(request.url);
    if (request.method === "GET" && url.pathname === "/api/health") {
      return json({
        ok: true,
        service: "FLIXO Command Center API",
        aiConfigured: Boolean(env.FLIXO_AI_API_URL && env.FLIXO_AI_API_KEY && env.FLIXO_AI_MODEL),
        ownerAuthConfigured: Boolean(env.FLIXO_OWNER_TOKEN && env.FLIXO_OWNER_TOKEN.length >= 32)
      });
    }

    if (request.method !== "POST" || !["/api/command", "/api/execute"].includes(url.pathname)) {
      return json({ ok: false, error: "Not found." }, 404);
    }
    if (!authorized(request, env)) return json({ ok: false, error: "Owner authorization required." }, 401);
    if (!env.FLIXO_AI_API_URL || !env.FLIXO_AI_API_KEY || !env.FLIXO_AI_MODEL) {
      return json({ ok: false, status: "brain_not_configured", error: "AI provider secrets/configuration are missing." }, 503);
    }

    try {
      const body = await readBody(request);
      if (url.pathname === "/api/command") {
        const result = await planOwnerCommand({
          command: body.command,
          language: body.language || "ru",
          env
        });
        return json(result, result.ok ? 200 : 502);
      }

      const result = await runApprovedAssignment({
        approval: body.approval === true,
        specialistId: body.specialistId,
        brief: body.brief,
        language: body.language || "ru",
        env
      });
      return json(result, result.ok ? 200 : 400);
    } catch (error) {
      return json({ ok: false, status: "request_error", error: String(error?.message || error) }, 400);
    }
  }
};
