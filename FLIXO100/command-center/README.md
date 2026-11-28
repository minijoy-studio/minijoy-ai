# FLIXO Command Center — backend/API 0.4.2 (Preview)

A Russian-language owner dashboard and Cloudflare Worker API for the FLIXO 1000 AI pilot. This is a development preview, **not a production-ready customer platform**.

## Implemented in the current branch

- Owner dashboard with live API health display and in-memory owner-token entry.
- Cloudflare Worker API with health/version endpoints and bearer-token protection for operational endpoints.
- D1 persistence for orders, tasks, payment records, audit events, and duplicate-execution claims.
- AI Director proposal flow with mandatory owner approval before specialist execution.
- Two callable specialist workflows using one shared OpenAI Responses API adapter:
  - `pilot-002` — Social Media Content Planner (seven-day content calendar).
  - `pilot-004` — Product Description Writer (product listing draft).
- Order, task, audit, and payment-status record endpoints.

## Important limitations — not yet delivered

- Preview health must report `ready: true` before authenticated end-to-end tests. The last verified Preview response reported `aiConfigured: false` and `ownerAuthConfigured: false`, while D1 was connected.
- The dashboard/API does not yet have a public customer intake or customer account/checkout experience. `POST /api/orders` is owner-authenticated.
- Payment records are bookkeeping only. No payment gateway is connected and no card is charged.
- The two specialist workflows share one AI provider; they are not independent model instances or a staffed team.
- No customer notifications, automated refunds, public publishing, or autonomous external actions are implemented.
- Full integration, security, load, and end-to-end tests have not passed.
- Production deployment has not been approved or completed.

## Preview setup

See [API-SETUP.md](./API-SETUP.md). Keep all secrets in Cloudflare Worker secrets; never place credentials in Git, browser code, screenshots, or chat.

## Release gate

Do not describe this project as commercially launched until Preview health is ready, authenticated command and order workflows pass, customer intake and payment gateway are implemented and tested, security checks pass, and Production release is explicitly approved by the owner.
