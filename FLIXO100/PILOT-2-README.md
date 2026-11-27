# FLIXO 1000 AI — first two specialist workflows

Two pilot roles now have callable workflows through the shared model adapter:

1. **Social Media Content Planner** — creates a seven-day content calendar with hooks, captions, calls to action, and visual briefs.
2. **Product Description Writer** — creates product listing copy using only customer-supplied, verifiable product facts.

## Use

Import the functions from `specialists.js` and pass:
- `brief`: customer-provided task details
- `language`: output language (defaults to Russian)
- `env`: server-side configuration containing `FLIXO_AI_API_URL`, `FLIXO_AI_API_KEY`, and `FLIXO_AI_MODEL`

Example:

```js
import {
  runSocialMediaContentPlanner,
  runProductDescriptionWriter
} from "./specialists.js";

const result = await runSocialMediaContentPlanner({
  brief: "A small bakery in Bishkek; Instagram; attract weekday lunch customers; friendly tone.",
  language: "ru",
  env
});
```

## Safety and status

- Both workflows use one shared AI provider adapter; they are not two separate model instances.
- They return drafts for human review. They do not contact customers, publish, upload, spend money, or process payments.
- The model provider must be configured as server-side secrets before either workflow can generate AI output.
- Test outputs for accuracy and usefulness before offering paid services.
- The $10/day per-specialist figure is a target, not a guarantee. Track paid revenue, provider costs, refunds, taxes, and net profit separately.
