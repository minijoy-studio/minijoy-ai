/**
 * MINIJOY API — Cloudflare Worker
 * Required Worker secrets:
 *   FAL_API_KEY
 *   MINIJOY_API_SECRET
 *
 * Routes:
 *   GET  /health
 *   POST /api/generate
 *   GET  /api/status/:requestId
 *   GET  /api/result/:requestId
 */

const TEXT_MODEL = "fal-ai/pixverse/v6/text-to-video";
const IMAGE_MODEL = "fal-ai/pixverse/v6/image-to-video";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type, x-minijoy-secret",
    },
  });
}

function authorized(request, env) {
  const expected = env.MINIJOY_API_SECRET;
  const supplied = request.headers.get("x-minijoy-secret");
  return Boolean(expected && supplied && supplied === expected);
}

function validPrompt(prompt) {
  return typeof prompt === "string" && prompt.trim().length > 0 &&
    new TextEncoder().encode(prompt).length <= 2048;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-methods": "GET, POST, OPTIONS",
          "access-control-allow-headers": "content-type, x-minijoy-secret",
          "access-control-max-age": "86400",
        },
      });
    }

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "MINIJOY API", version: "1.0.0" });
    }

    if (!authorized(request, env)) {
      return json({ ok: false, error: "Unauthorized" }, 401);
    }

    if (!env.FAL_API_KEY) {
      return json({ ok: false, error: "FAL_API_KEY is not configured" }, 500);
    }

    if (url.pathname === "/api/generate" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ ok: false, error: "Request body must be valid JSON" }, 400);
      }

      const mode = body.mode === "image-to-video" ? "image-to-video" : "text-to-video";
      const model = mode === "image-to-video" ? IMAGE_MODEL : TEXT_MODEL;

      if (!validPrompt(body.prompt)) {
        return json({ ok: false, error: "A prompt of 1–2048 UTF-8 bytes is required" }, 400);
      }

      const input = {
        prompt: body.prompt.trim(),
        resolution: ["360p", "540p", "720p", "1080p"].includes(body.resolution)
          ? body.resolution : "720p",
        duration: Number.isInteger(body.duration) && body.duration >= 1 && body.duration <= 15
          ? body.duration : 5,
        generate_audio_switch: body.generateAudio === true,
        generate_multi_clip_switch: body.multiClip === true,
        enable_safety_checker: true,
      };

      if (mode === "image-to-video") {
        if (typeof body.imageUrl !== "string" || !/^https:\/\//i.test(body.imageUrl)) {
          return json({ ok: false, error: "A public HTTPS imageUrl is required for image-to-video" }, 400);
        }
        input.image_url = body.imageUrl;
      } else {
        input.aspect_ratio = ["16:9", "4:3", "1:1", "3:4", "9:16", "2:3", "3:2", "21:9"].includes(body.aspectRatio)
          ? body.aspectRatio : "16:9";
      }

      const response = await fetch(`https://queue.fal.run/${model}`, {
        method: "POST",
        headers: {
          "authorization": `Key ${env.FAL_API_KEY}`,
          "content-type": "application/json",
        },
        body: JSON.stringify(input),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        return json({ ok: false, error: data.detail || data.message || "fal.ai request failed", providerStatus: response.status }, response.status);
      }

      return json({
        ok: true,
        model,
        requestId: data.request_id,
        statusUrl: data.status_url,
        responseUrl: data.response_url,
      }, 202);
    }

    const statusMatch = url.pathname.match(/^\/api\/status\/([a-zA-Z0-9-]+)$/);
    if (statusMatch && request.method === "GET") {
      const requestId = statusMatch[1];
      const model = url.searchParams.get("model") === IMAGE_MODEL ? IMAGE_MODEL : TEXT_MODEL;
      const response = await fetch(`https://queue.fal.run/${model}/requests/${requestId}/status`, {
        headers: { "authorization": `Key ${env.FAL_API_KEY}` },
      });
      const data = await response.json().catch(() => ({}));
      return json({ ok: response.ok, ...data }, response.status);
    }

    const resultMatch = url.pathname.match(/^\/api\/result\/([a-zA-Z0-9-]+)$/);
    if (resultMatch && request.method === "GET") {
      const requestId = resultMatch[1];
      const model = url.searchParams.get("model") === IMAGE_MODEL ? IMAGE_MODEL : TEXT_MODEL;
      const response = await fetch(`https://queue.fal.run/${model}/requests/${requestId}`, {
        headers: { "authorization": `Key ${env.FAL_API_KEY}` },
      });
      const data = await response.json().catch(() => ({}));
      return json({ ok: response.ok, ...data }, response.status);
    }

    return json({ ok: false, error: "Not found" }, 404);
  },
};
