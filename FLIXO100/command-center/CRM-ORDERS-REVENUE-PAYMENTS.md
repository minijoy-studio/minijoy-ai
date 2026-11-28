# FLIXO Command Center — CRM, Orders, Revenue & Payments

## Status
This is an implementation plan for the isolated feature branch. It is not deployed.
Apply `migrations/0001_initial.sql` to a dedicated staging D1 database before binding it to any Worker.

## Proposed D1 binding
- Binding name: `FLIXO_DB`
- Staging database only until tests and owner approval are complete.

## Planned API
- `POST /api/leads`: create a lead; validate contact details and explicit consent.
- `GET /api/leads`: owner-authenticated search by status, source, score, and query; bounded pagination.
- `PATCH /api/leads/:id`: update status/score/next action.
- `POST /api/orders`: accept an order request into `received` / `awaiting_review`; do not imply acceptance or payment.
- `GET /api/orders`: owner-authenticated listing and filters.
- `PATCH /api/orders/:id`: controlled status transition with an `order_events` audit row.
- `GET /api/revenue/ledger`: owner-only ledger, integer minor units, explicit currency.
- `GET /api/revenue/report`: aggregate gross payments, processor fees, refunds, and net.

## Lead discovery rules
Use compliant sources, public business directories/APIs, and user-provided prospect lists. Respect site terms, robots rules, privacy law, opt-outs, and rate limits. Store source URL and collection timestamp when implemented. Do not auto-contact prospects. Contact requires a separate owner-approved action and recorded consent/legal basis.

## Revenue accounting
Store immutable signed events (or non-negative amounts with explicit kind); never create revenue rows from an order alone. Record only provider-confirmed payment/refund/fee events. Net = gross payments - processor fees - refunds, grouped by currency; never sum different currencies together. Amounts are integer minor units, not floating point.

## Payment provider boundary
Prepare Stripe/PayPal sandbox adapters only after selecting a provider. Keep API keys in Worker secrets. Use provider-hosted checkout/tokenization; never receive or store card numbers or CVV. Verify webhook signatures, enforce idempotency, and reconcile provider events. Sandbox must be explicitly enabled. Live merchant activation, live charges, refunds, and payout changes require separate owner approval.

## Deployment controls
- This branch is isolated from `main`.
- Do not merge or deploy to production without review and explicit approval.
- Set `FLIXO_DB` only on a staging Worker for integration tests.
