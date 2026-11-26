# MINIJOY Cloudflare Launch Taskforce

Status: assigned as a parallel workstream; this is a task plan, not an autonomous running team.

## Mission
Get the existing `minijoy-api` Cloudflare Worker deployed and prove one end-to-end PixVerse V6 video generation without exposing credentials.

## Work lanes

### 1. DEVOPS AI — deployment lead
- Confirm the target Cloudflare account and existing Worker name `minijoy-api`.
- Check Wrangler configuration and deployment prerequisites.
- Deploy only after the owner has authorized the target environment.
- Record deployment version and provider-confirmed result.

### 2. TECH AI — code and API
- Review `worker.js` routes, request validation, and fal.ai queue handling.
- Verify status/result response handling and error paths.
- Prepare any code changes on a feature branch; do not push secrets.

### 3. SECURITY REVIEW — release gate
- Confirm `FAL_API_KEY` and `MINIJOY_API_SECRET` exist as server-side Worker secrets without reading or printing their values.
- Do not use the shared-secret header from a public browser/mobile client.
- Require short-lived user authentication before public generation access.
- Replace wildcard CORS with exact approved frontend origins before public exposure.
- Keep production deployment, secret rotation, DNS, billing, and destructive changes behind explicit owner approval.

### 4. QA — independent verification
- Check `GET /health` after deployment.
- Submit one controlled, low-cost PixVerse V6 text-to-video test from a trusted server-side caller.
- Poll status until terminal state.
- Confirm the result contains a usable `video.url`.
- Save redacted evidence: timestamps, HTTP statuses, request ID, model, and outcome. Never save credentials.

## Exit criteria
- Worker deployment is confirmed by Cloudflare.
- `/health` returns success from the deployed URL.
- Required secrets are confirmed configured without disclosure.
- One generation completes and returns a video URL.
- CORS/authentication risks are addressed before public customer access.

## Current blockers
- Cloudflare deployment and account access are not yet verified in this repository audit.
- Secret presence is unverified.
- No live video-generation result has been observed.
- Production frontend origin must be confirmed before setting an exact CORS allowlist.

## Reporting rule
A successful GitHub build or a successful `/health` check alone does not prove video generation works. Report each exit criterion separately as verified, blocked, or not tested.
