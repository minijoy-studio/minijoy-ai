# FLIXO AI

A separate cinematic-story brand frontend prototype inside the MINIJOY AI repository.

## Current capabilities
- Responsive FLIXO-branded landing page
- Genre and target-duration selection
- Story brief preparation in the browser

## Not yet connected
- Live AI video rendering
- Secure backend authentication
- Customer accounts, payments, quotas, and order history

The page intentionally does not expose MINIJOY/FAL secrets or call the current Worker with a shared secret from browser code. The existing Worker uses server-side credentials and must be extended with secure user authentication before a public browser client can submit paid generation jobs.

## Next implementation steps
1. Add authenticated customer sessions/tokens to the Worker.
2. Add separate FLIXO product configuration and usage limits.
3. Connect the studio form to the authenticated generation/status/result API.
4. Test a small internal generation and measure actual provider cost before enabling payments.
