# MINIJOY AI

AI-powered platform for creating animated videos and films.

## API backend

The API submits PixVerse V6 video jobs through fal.ai. The same API logic can run as a Cloudflare Worker or as a Node.js HTTP service.

### Required environment secrets

Configure these as private environment variables in the hosting platform:

- `FAL_API_KEY` — API key from your fal.ai account.
- `MINIJOY_API_SECRET` — a long, random secret used by trusted MINIJOY clients when calling this API.

Never place either secret in browser or mobile-app source code, GitHub, or a public message.

## Railway deployment (migration branch)

The `railway-migration` branch adds a Node.js HTTP adapter (`server.js`), `package.json`, and `railway.json`. It reuses the existing `worker.js` API logic rather than rewriting the generation endpoints.

To deploy:
1. Create a Railway project and connect this GitHub repository.
2. Select branch `railway-migration`.
3. Set the start command to `npm start` (also declared in `railway.json`).
4. Add the two secrets above as Railway variables.
5. Deploy, then verify `GET /health` and test generation with a valid secret and fal.ai key.

Railway pricing currently includes a $0 Free plan with $1 monthly usage credit and sleeping services; Hobby starts at $5/month. Check current limits before relying on it for production: https://railway.com/pricing

## Cloudflare deployment

The Worker entry point is `worker.js`; deployment settings are in `wrangler.toml`.

With Wrangler installed and authenticated:
```bash
npx wrangler secret put FAL_API_KEY
npx wrangler secret put MINIJOY_API_SECRET
npx wrangler deploy
```

## Routes

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

The generate route returns a `requestId` and the selected `model`. Pass that exact model ID as the `model` query parameter when checking status and retrieving the result. A successful result contains the PixVerse output object, including `video.url`.

## Important

The code is committed but is not live until deployed and configured with both secrets. A successful `/health` response alone does not prove fal.ai generation is configured.
