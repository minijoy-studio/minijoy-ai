# FLIXO Command Center API — 0.4.2

This document describes the development Preview only. It is not a Production deployment instruction.

## Required Cloudflare Preview configuration

The branch Preview currently uses the D1 binding `FLIXO_DB` pointing to `flixo-command-center-preview`.

The Worker requires:
- Secret `FLIXO_OWNER_TOKEN` (random value, at least 32 characters).
- Secret `FLIXO_AI_API_KEY` (provider API key).
- Variable `FLIXO_AI_API_URL` (for OpenAI Responses API: `https://api.openai.com/v1/responses`).
- Variable `FLIXO_AI_MODEL` (model identifier supported by the provider).
- Variable `FLIXO_ALLOWED_ORIGINS` (exact frontend origin; currently empty, so a separate browser frontend origin is not allow-listed).

Cloudflare may show encrypted secret names as present while a branch Preview runtime still does not receive the values. The runtime health endpoint is authoritative: it must report `aiConfigured: true`, `ownerAuthConfigured: true`, `databaseConfigured: true`, and `databaseConnected: true`, with `ready: true`.

Never reveal or paste secret values into chat, Git, or browser source. Do not copy Production secrets into Preview.

## Endpoints

- `GET /api/health` — public configuration/DB health; never returns secret values.
- `GET /api/version` — API version.
- `POST /api/command` — owner-authenticated AI Director proposal.
- `POST /api/execute` — owner-authenticated specialist execution; requires explicit `approval: true`.
- `GET /api/orders` — owner-authenticated order list.
- `POST /api/orders` — owner-authenticated order creation (`customerName, customerEmail, service, brief`; optional `currency, quotedAmount`). **This is not a public customer intake endpoint.**
- `GET /api/orders/:id` — owner-authenticated order, tasks and payment records.
- `POST /api/orders/:id/plan` — owner-authenticated AI proposal creation.
- `POST /api/orders/:id/approve` — owner-authenticated execution of the pending specialist proposal with `{ "approval": true }`; a D1 claim blocks duplicate execution.
- `POST /api/orders/:id/payments` — owner-authenticated payment-status bookkeeping only; it does not charge a card and no gateway is connected.

All protected endpoints require `Authorization: Bearer <FLIXO_OWNER_TOKEN>` and JSON content type. Customer/order/task/payment changes are audit logged.

## Specialist scope

The current Director can assign only:
- `pilot-002`: Social Media Content Planner.
- `pilot-004`: Product Description Writer.

Both workflows use the shared AI provider adapter. They produce drafts for human review and do not contact customers, publish, upload, or spend money. Other divisions listed in the shared brain are planning categories, not callable specialist agents.

## Preview database migrations

The Preview D1 schema includes:
1. `migrations/0001_initial.sql` — orders, tasks, payment records and audit events.
2. `migrations/0002_execution_claims.sql` — duplicate-execution guard.

Do not apply these instructions to Production. Do not deploy or migrate Production without the owner's separate explicit approval.

## Release blockers

1. Resolve the Preview runtime mismatch where encrypted secret names appear in the dashboard but health reports AI/auth as not configured.
2. Verify authenticated AI planning and approved specialist execution end to end.
3. Implement a safe public customer intake flow with abuse/rate controls and customer-facing status/communications.
4. Integrate a real payment provider with verified webhooks, reconciliation and refund handling.
5. Complete security, reliability and end-to-end testing.
6. Obtain explicit owner approval before any Production deployment.
