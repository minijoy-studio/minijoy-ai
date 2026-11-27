# FLIXO AI Director — pilot scope

The AI Director is the command interpreter and task coordinator for the initial pilot.

## Responsibilities
- Interpret the owner's natural-language command.
- Select one of the two available specialists when the request fits.
- Prepare a structured assignment and list missing information.
- Return the proposal for owner review.
- Run an approved specialist workflow only when a trusted server explicitly passes `approval: true`.

## Pilot specialists
- `pilot-002` — Social Media Content Planner.
- `pilot-004` — Product Description Writer.

## Authority boundaries
The Director cannot independently contact customers, publish content, spend money, process payments, or claim work/revenue that has not happened. It cannot run a specialist without explicit owner approval.

## Configuration
Uses the shared provider adapter in `brain.js`. Required server-side environment values:
- `FLIXO_AI_API_URL`
- `FLIXO_AI_API_KEY`
- `FLIXO_AI_MODEL`

These must be configured on a secure server, never in browser code or committed to Git.

## Status
Code module prepared; not deployed or connected to an authenticated command API. No autonomous operation or revenue is active yet.
