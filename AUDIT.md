# MINIJOY AI — Technical Audit (2026-11-25)

## Scope inspected
- `worker.js`
- `wrangler.toml`
- `agents/manifest.json`
- `README.md`
- Official fal.ai PixVerse V6 Text-to-Video and Image-to-Video API schemas
- Official Cloudflare Wrangler compatibility-date guidance

## Verified
- The Worker entry point in `wrangler.toml` matches the repository path: `worker.js`.
- The configured compatibility date is `2026-11-25`.
- PixVerse V6 text-to-video input fields currently used by the Worker are present in the official schema: prompt, aspect_ratio, resolution, duration, negative_prompt, style, seed, generate_audio_switch, generate_multi_clip_switch, thinking_type, and enable_safety_checker.
- PixVerse V6 image-to-video requires `image_url`; the Worker supplies it for image-to-video requests.
- The fal.ai queue submission/status/result URL pattern is used by the Worker.

## Release blockers
1. **No confirmed deployment.** Repository files do not prove that a Cloudflare Worker has been deployed.
2. **Secrets are unverified.** The presence of `FAL_API_KEY` and `MINIJOY_API_SECRET` in Cloudflare has not been independently verified.
3. **No live generation test.** No successful fal.ai request or returned video URL has been observed.
4. **No production frontend in the inspected repository files.** The current Worker is an API backend, not the complete MINIJOY website/application.
5. **Agent manifest is architecture only.** Developer AI, Director AI, Sales AI, and Operator AI are not deployed agents. They still need an LLM runtime, provider credentials, routing/orchestration, and (for Sales AI) an approved customer-data source.

## Security requirement
- Never put `FAL_API_KEY` or `MINIJOY_API_SECRET` in browser JavaScript, a mobile app bundle, public GitHub files, or chat.
- The current shared-secret header is suitable only for trusted server-to-server callers. A public website/mobile client must authenticate users with short-lived, verifiable user tokens; the server validates those tokens and keeps provider secrets private.
- Before public launch, replace wildcard CORS with the exact production frontend origins, add request rate limits and abuse controls, and define user quotas/billing safeguards.

## Next release sequence
1. Restore Cloudflare dashboard access and confirm the existing Worker name/account.
2. Verify required Worker secrets are configured without revealing their values.
3. Deploy the Worker from this repository.
4. Test `GET /health`.
5. Test one low-cost PixVerse V6 generation using a server-side authenticated request.
6. Verify queue completion and that the result includes `video.url`.
7. Build/finish the frontend and secure user authentication before exposing generation to customers.
8. Implement and test each AI agent; do not describe the agents as operational until they pass real tests.

## Current status
**Prepared backend code; not production deployed; no verified video generation; agents not operational.**
