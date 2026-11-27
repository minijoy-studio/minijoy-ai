import { createFilmPlan, buildScenePrompt } from "./film-pipeline.js";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store"
};

function sendJson(response, status, payload) {
  response.writeHead(status, JSON_HEADERS);
  response.end(JSON.stringify(payload));
}

async function readJson(request, maxBytes = 64 * 1024) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error("Request body is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    throw error;
  }
}

export async function handleFlixoRequest(request, response) {
  const url = new URL(request.url || "/", "http://localhost");

  if (request.method === "GET" && url.pathname === "/api/health") {
    return sendJson(response, 200, {
      ok: true,
      service: "FLIXO AI",
      capability: "film-planning",
      videoGeneration: "not-connected"
    });
  }

  if (request.method === "POST" && url.pathname === "/api/films/plan") {
    try {
      const input = await readJson(request);
      const plan = createFilmPlan(input);
      return sendJson(response, 201, { ok: true, plan });
    } catch (error) {
      const status = error.statusCode || (error instanceof TypeError || error instanceof RangeError ? 400 : 422);
      return sendJson(response, status, {
        ok: false,
        error: error.message || "Unable to create film plan."
      });
    }
  }

  const promptMatch = url.pathname.match(/^\/api\/films\/([^/]+)\/scenes\/(\d+)\/prompt$/);
  if (request.method === "POST" && promptMatch) {
    return sendJson(response, 501, {
      ok: false,
      error: "Scene prompt generation requires a persisted film plan. Storage is not connected yet."
    });
  }

  return sendJson(response, 404, { ok: false, error: "Route not found." });
}
