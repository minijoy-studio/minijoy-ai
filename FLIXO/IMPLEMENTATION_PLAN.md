# FLIXO AI — 30-minute film pipeline

Status: implementation design on a feature branch. This document does not claim that rendering, authentication, storage, or export is already operational.

## Product target

FLIXO creates complete story films with a target runtime of 30 minutes. Trailers and short films are additional output formats, not substitutes for the full-film product.

## Important provider constraint

The current Worker submits one PixVerse V6 job with a clip duration capped at 15 seconds. A single request cannot produce a 30-minute film. FLIXO must orchestrate many short shots and assemble them into one continuous film.

At a 15-second target per shot, a 30-minute runtime requires about 120 completed shots before allowing for transitions, retakes, and editorial changes. Actual shot count should be calculated from the screenplay and each provider's supported duration.

## Proposed pipeline

1. **Project brief** — genre, language, audience, visual style, runtime, synopsis, content rating.
2. **Story development** — logline, characters, character bible, world/style bible, three-act structure.
3. **Screenplay** — scenes with locations, time of day, dialogue, action, and estimated duration. The scene durations must sum to the requested runtime.
4. **Shot planning** — split scenes into provider-compatible shots; record prompt, character references, camera, aspect ratio, audio needs, and continuity notes.
5. **Generation queue** — submit shots individually through the server; persist provider request IDs and retry state. Never expose provider API keys to the browser.
6. **Review and continuity** — let the creator approve, reject, or regenerate individual shots while preserving approved takes.
7. **Assembly** — order approved shots, normalize frame rate/resolution/audio, add transitions, dialogue, music, subtitles, opening/closing credits, and render a single MP4.
8. **Delivery** — store the final asset and provide a private download/share link with project history.

## Backend boundaries

- Browser clients must never receive FAL_API_KEY or the existing shared MINIJOY_API_SECRET.
- Add separate FLIXO user authentication with short-lived signed sessions/tokens. Validate ownership on every project, shot, and export request.
- Keep MINIJOY and FLIXO product settings, quotas, and billing records separate.
- Use persistent storage for projects, screenplay versions, shot jobs, provider request IDs, asset URLs, and export state. Cloudflare D1 plus R2 is a candidate; confirm account bindings and limits before implementation.
- Add per-user rate limits, job concurrency limits, cost estimates, cancellation, idempotency, and abuse controls.
- Restrict CORS to the production FLIXO origin before public launch.
- Do not enable customer payments until a complete internal film has been generated, assembled, timed, and costed.

## Suggested API surface

All routes except health checks require a valid user session and enforce project ownership.

- POST /api/flixo/projects — create a film project.
- POST /api/flixo/projects/:projectId/screenplay — create or revise screenplay and scene timings.
- POST /api/flixo/projects/:projectId/shots/plan — create a provider-compatible shot list.
- POST /api/flixo/projects/:projectId/shots/:shotId/generate — enqueue one shot.
- GET /api/flixo/projects/:projectId/jobs — retrieve job progress.
- POST /api/flixo/projects/:projectId/assemble — enqueue final assembly.
- GET /api/flixo/projects/:projectId/export — retrieve export status and authorized asset link.

These are proposed routes, not live endpoints.

## Delivery milestones

1. Secure FLIXO-specific authentication and persistent project/job records.
2. Screenplay and scene-duration planner with a hard 30-minute runtime check.
3. Shot planner that respects provider duration limits and character continuity.
4. Queue worker with retries, cancellation, cost tracking, and asset storage.
5. Assembly/export worker and playable MP4 verification.
6. Internal end-to-end film test; only then pricing, quotas, and public launch.

## Current verified baseline

- FLIXO/index.html is a static prototype that prepares a brief in the browser.
- worker.js currently supports PixVerse V6 text-to-video and image-to-video requests with a maximum clip duration of 15 seconds.
- The Worker uses a shared server secret and is not suitable as-is for direct public browser authentication.
- No successful FLIXO full-film render or MP4 export has been verified.