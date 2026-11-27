/**
 * FLIXO 1000 AI — first two runnable specialist workflows.
 * These roles use the shared model adapter in brain.js; they are not separate
 * model instances. They return drafts for human review and do not contact or
 * publish to customers.
 */
import { think } from "./brain.js";

const MAX_INPUT = 6000;

function requireText(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${field} is required.`);
  }
  if (value.length > MAX_INPUT) {
    throw new Error(`${field} is too long (max ${MAX_INPUT} characters).`);
  }
  return value.trim();
}

async function runWithRole({ role, deliverable, brief, language, env }) {
  const safeBrief = requireText(brief, "brief");
  const prompt = [
    `Specialist role: ${role}.`,
    `Required deliverable: ${deliverable}.`,
    "Create a complete, useful first draft based only on facts supplied in the brief.",
    "Do not invent product specifications, prices, testimonials, analytics, business results, or customer facts.",
    "Clearly mark missing information as [NEED DETAILS] and assumptions as [ASSUMPTION].",
    "Use clear headings and practical, ready-to-review content.",
    "Do not contact customers, publish, upload, spend money, or take any external action.",
    "Return valid JSON with keys: summary, deliverable, missingInformation (array), assumptions (array), qualityChecks (array), suggestedNextStep.",
    `Customer brief:\n${safeBrief}`
  ].join("\n\n");

  return think(prompt, env, language || "ru");
}

export async function runSocialMediaContentPlanner({ brief, language = "ru", env }) {
  return runWithRole({
    role: "Social Media Content Planner",
    deliverable: "A seven-day content calendar. For each day include platform, post format, topic, hook, caption, call to action, and visual brief. Include a sensible mix and adapt to the audience and business goal.",
    brief,
    language,
    env
  });
}

export async function runProductDescriptionWriter({ brief, language = "ru", env }) {
  return runWithRole({
    role: "Product Description Writer",
    deliverable: "A customer-ready product listing draft: concise title, short description, full description, key benefits grounded in supplied facts, specifications, suitable audience, and a call to action. Separate verified features from missing details; never invent claims.",
    brief,
    language,
    env
  });
}

export const PILOT_SPECIALISTS = [
  {
    id: "pilot-002",
    name: "Social Media Content Planner",
    input: "Business, target audience, platform, goal, tone, and any product/service facts",
    output: "Seven-day content calendar with captions and visual briefs",
    status: "workflow_ready_requires_model_credentials"
  },
  {
    id: "pilot-004",
    name: "Product Description Writer",
    input: "Product name, verified features, specifications, audience, and tone",
    output: "Ready-to-review product listing copy",
    status: "workflow_ready_requires_model_credentials"
  }
];
