# FLIXO Command Center — prototype 0.1

A mobile-friendly Russian-language owner dashboard prototype.

## Current functionality
- Select a recipient (planned AI Director, Social Media Content Planner, Product Description Writer).
- Enter a natural-language instruction.
- Prepare and inspect a local draft before execution.
- Shows honest development status and owner approval boundaries.

## Not connected yet
- No server API or model provider is connected.
- Preparing a draft does not send a command or start a job.
- No authentication, persistent job queue, customer accounts, payment processing, or revenue reporting exists yet.

## Next implementation steps
1. Add authenticated server endpoint for command submission.
2. Connect the shared AI brain using server-side secrets only.
3. Add persistent task queue, audit log, and approval workflow.
4. Connect and test the first two specialist workflows.
5. Add real order, cost, refund, and net-profit reporting.

Never put API keys in this static page or commit secrets to Git.
