import { createServer } from "node:http";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import worker from "./worker.js";

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";
const ROOT = fileURLToPath(new URL(".", import.meta.url));
// Keep the internal Worker-to-server credential private and available even
// when Railway has not been given a separate MINIJOY_API_SECRET variable.
const INTERNAL_API_SECRET =
  process.env.MINIJOY_API_SECRET || randomBytes(32).toString("hex");
const RUNTIME_ENV = {
  ...process.env,
  MINIJOY_API_SECRET: INTERNAL_API_SECRET
};
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg", ".webp": "image/webp", ".mp4": "video/mp4"
};

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 2 * 1024 * 1024) throw new Error("Request body too large");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

function send(res, status, body, contentType = "application/json; charset=utf-8") {
  res.statusCode = status;
  res.setHeader("content-type", contentType);
  res.setHeader("cache-control", "no-store");
  res.end(body);
}

const server = createServer(async (req, res) => {
  try {
    const host = req.headers.host || "localhost";
    const url = new URL(req.url || "/", `http://${host}`);

    if (req.method === "GET" && url.pathname === "/") {
      const html = await readFile(resolve(ROOT, "index.html"));
      return send(res, 200, html, "text/html; charset=utf-8");
    }

    if (req.method === "GET" && url.pathname.startsWith("/videos/")) {
      const requested = resolve(ROOT, decodeURIComponent(url.pathname.slice(1)));
      if (!requested.startsWith(ROOT + sep)) {
        return send(res, 403, JSON.stringify({ ok: false, error: "Forbidden" }));
      }
      try {
        const file = await readFile(requested);
        const ext = requested.slice(requested.lastIndexOf(".")).toLowerCase();
        return send(res, 200, file, MIME[ext] || "application/octet-stream");
      } catch {
        return send(res, 404, JSON.stringify({ ok: false, error: "Media not found" }));
      }
    }

    const headers = new Headers();
    for (const [key, value] of Object.entries(req.headers)) {
      if (Array.isArray(value)) headers.set(key, value.join(", "));
      else if (value !== undefined) headers.set(key, value);
    }

    // Never trust a client-supplied internal credential. The server injects
    // its private credential only for requests handled by the local Worker.
    if (url.pathname.startsWith("/api/")) {
      headers.delete("x-minijoy-secret");
      headers.set("x-minijoy-secret", INTERNAL_API_SECRET);
    }

    const init = { method: req.method, headers };
    if (req.method !== "GET" && req.method !== "HEAD") {
      init.body = await readBody(req);
    }

    const request = new Request(url, init);
    const response = await worker.fetch(request, RUNTIME_ENV);
    res.statusCode = response.status;
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    const status = error.message === "Request body too large" ? 413 : 500;
    send(res, status, JSON.stringify({
      ok: false,
      error: status === 413 ? "Request body too large" : "Internal server error"
    }));
  }
});

server.listen(PORT, HOST, () => {
  console.log(`MINIJOY AI listening on ${HOST}:${PORT}`);
});
