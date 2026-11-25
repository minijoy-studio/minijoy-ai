# MINIJOY AI

AI-powered platform for creating animated videos and films.

## API backend

This repository contains a Cloudflare Worker API that submits PixVerse V6 video jobs through fal.ai.

### Required Cloudflare Worker secrets

Configure these as **Worker Secrets** (not plain variables):

- `FAL_API_KEY` — API key from your fal.ai account.
- `MINIJOY_API_SECRET` — a long, random secret used by trusted MINIJOY clients when calling this API.

Never place either secret in browser or mobile-app source code, GitHub, or a public message.

### Deploy

The Worker entry point is `worker.js`; deployment settings are in `wrangler.toml`.

With Wrangler installed and authenticated:

```bash
npx wrangler secret put FAL_API_KEY
npx wrangler secret put MINIJOY_API_SECRET
npx wrangler deploy
```

### Routes

- `GET /health` — public health check.
- `POST /api/generate` — submit a video job.
- `GET /api/status/:requestId?model=<model-id>` — check queue status.
- `GET /api/result/:requestId?model=<model-id>` — fetch completed output.

All routes except `/health` require the `x-minijoy-secret` header.

Example text-to-video request:

```json
{
  "mode": "text-to-video",
  "prompt": "A friendly brown teddy bear in a yellow shirt explores a bright forest with a little grey elephant",
  "duration": 5,
  "resolution": "720p",
  "aspectRatio": "16:9",
  "generateAudio": true,
  "multiClip": false,
  "style": "3d_animation"
}
```

The generate route returns a `requestId` and the selected `model`. Pass that exact model ID as the `model` query parameter when checking status and retrieving the result.

A successful result contains the PixVerse output object, including `video.url`.

## Important

The code in GitHub is prepared for deployment; it is not live until deployed to Cloudflare and configured with both secrets. A successful `/health` response alone does not prove fal.ai generation is configured.
