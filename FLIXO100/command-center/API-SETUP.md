# FLIXO 1000 AI backend API — 0.4.0

## Required Cloudflare configuration
Bind a D1 database as `FLIXO_DB`. Apply `migrations/0001_initial.sql` to that database.
Set Worker secret `FLIXO_OWNER_TOKEN` to a random value of at least 32 characters and `FLIXO_AI_API_KEY` to the provider key. Set variables `FLIXO_AI_API_URL` and `FLIXO_AI_MODEL`. Keep secrets out of Git and browser code. Set `FLIXO_ALLOWED_ORIGINS` to exact frontend origins when frontend and API use different origins.

## Endpoints
- `GET /api/health` — public configuration health (never returns secret values).
- `POST /api/command` — authenticated AI Director proposal.
- `POST /api/execute` — authenticated specialist execution; requires `approval: true`.
- `GET /api/orders` — owner order list.
- `POST /api/orders` — create order: `customerName, customerEmail, service, brief`, optional `currency, quotedAmount`.
- `GET /api/orders/:id` — order, tasks and payment records.
- `POST /api/orders/:id/plan` — ask AI to prepare a proposal; creates an approval-pending task.
- `POST /api/orders/:id/approve` — execute the pending specialist proposal only with `{ "approval": true }`.
- `POST /api/orders/:id/payments` — record a payment status; this is bookkeeping only and does not charge a card.

All protected endpoints require `Authorization: Bearer <FLIXO_OWNER_TOKEN>` and JSON content type. Responses are JSON. Customer/order/task/payment changes are audit logged.

## Important scope
This backend creates and tracks orders, persists proposals and results, and records payment statuses. A real payment gateway, customer-facing checkout, customer accounts, email notifications, automated refunds, and a broader independently staffed specialist team are not included in this iteration. The two existing specialist workflows use the shared AI provider. Do not represent this as a fully launched commercial platform until these integrations and end-to-end tests are complete.

## Isolated preview deployment

Use `wrangler.preview.toml` to deploy a separate Worker named `flixo-command-center-api-preview` against the dedicated preview D1 database. This avoids Cloudflare's shared-preview-secret behavior and does not alter the production Worker.

From `FLIXO100/command-center`:
1. Apply schema: `npx wrangler d1 migrations apply flixo-command-center-preview --remote --config wrangler.preview.toml`.
2. Set secrets interactively (never paste values into Git or chat): `npx wrangler secret put FLIXO_OWNER_TOKEN --config wrangler.preview.toml` and `npx wrangler secret put FLIXO_AI_API_KEY --config wrangler.preview.toml`.
3. Deploy only the preview Worker: `npx wrangler deploy --config wrangler.preview.toml`.
4. Check `GET /api/health` and verify `databaseConfigured`, `databaseConnected`, `aiConfigured`, and `ownerAuthConfigured` are all true before running authenticated tests.

The preview AI key must be a separately authorized key. Do not copy production secrets into preview. Production is not deployed or migrated by these commands.
