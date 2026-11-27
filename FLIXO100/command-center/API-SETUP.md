# FLIXO Command Center API

Deploy this directory as a separate Cloudflare Worker. Do not replace the MINIJOY Worker.

## Secrets and variables

Set these in Cloudflare Worker Settings → Variables and Secrets:

- Secret `FLIXO_OWNER_TOKEN`: generate a long random token (at least 32 characters).
- Secret `FLIXO_AI_API_KEY`: API key from the chosen model provider.
- Variable `FLIXO_AI_API_URL`: provider's OpenAI-compatible chat-completions URL.
- Variable `FLIXO_AI_MODEL`: model name supported by that provider.
- Optional variable `FLIXO_ALLOWED_ORIGINS`: comma-separated exact website origins. Same-origin requests are allowed automatically.

Never commit the secrets or put them in the browser.

## Endpoints

- `GET /api/health` — reports whether configuration is present (does not reveal secrets).
- `POST /api/command` — owner-authenticated AI Director proposal.
- `POST /api/execute` — owner-authenticated execution of one of the two specialist draft workflows; requires explicit `approval: true`.

All requests that create plans or run a specialist require `Authorization: Bearer <FLIXO_OWNER_TOKEN>`.

## Important limitations

- The API creates AI-generated drafts for owner review only.
- It does not find/contact customers, publish posts, take payments, or guarantee revenue.
- No durable task database, job queue, billing, or customer accounts are included yet.
- Use HTTPS. Keep the owner token private and rotate it if exposed.
