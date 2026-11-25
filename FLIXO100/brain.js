/**
 * FLIXO 1000 AI — shared AI brain (model-provider adapter)
 *
 * This is a reusable brain for all 1,000 role blueprints. It does not create
 * 1,000 separate model instances. It uses one configured OpenAI-compatible
 * chat-completions endpoint and returns a work plan for human review.
 *
 * Required runtime secrets/config:
 *   FLIXO_AI_API_URL  e.g. https://api.openai.com/v1/chat/completions
 *   FLIXO_AI_API_KEY  provider API key (store as a secret; never commit it)
 *   FLIXO_AI_MODEL    model name supported by the selected provider
 *
 * No payments, trading, purchases, outbound messages, or customer contact.
 */

const DIVISIONS = [
  "video and animation",
  "sales and customer acquisition",
  "graphic design and advertising",
  "social media and publishing",
  "e-commerce and online stores",
  "writing and documentation",
  "translation and localization",
  "education and learning",
  "audio and voice services",
  "websites, analytics and operations"
];

const MAX_TASK_CHARS = 8000;

export function buildBrainMessages(task, language = "ru") {
  if (typeof task !== "string" || !task.trim()) {
    throw new Error("A non-empty task description is required.");
  }
  if (task.length > MAX_TASK_CHARS) {
    throw new Error(`Task is too long; maximum is ${MAX_TASK_CHARS} characters.`);
  }

  const system = [
    "You are the shared planning brain for FLIXO 1000 AI, a global digital-services workbench.",
    "You may reason about any lawful, non-harmful business or service sector, not only the listed divisions.",
    "Choose the best specialist division or explain why a new category is needed.",
    `Existing divisions: ${DIVISIONS.join("; ")}.`,
    "Return concise JSON with keys: language, opportunity, customer, deliverable, recommendedDivision, specialistRoles (array), steps (array), estimatedEffort, risks (array), humanApprovalRequired, revenueModel, nextAction.",
    "Do not promise earnings or claim customers exist. Distinguish assumptions from verified facts.",
    "Do not provide investment, gambling, or speculative-trading promises. Never ask for passwords, card details, CVV, PINs, private keys, or one-time codes.",
    "Do not send messages, contact leads, spend money, publish content, transfer funds, or execute external actions. Produce a plan only.",
    "If the task is regulated or high-risk (medical, legal, financial, employment, safety), flag expert review and limit the output to general support.",
    "Use the requested response language."
  ].join(" ");

  return [
    { role: "system", content: system },
    { role: "user", content: `Response language: ${language}.\nTask/opportunity:\n${task.trim()}` }
  ];
}

/**
 * Ask the configured model to create a plan.
 * Compatible with providers exposing the OpenAI chat-completions API shape.
 */
export async function think(task, env, language = "ru") {
  if (!env?.FLIXO_AI_API_URL || !env?.FLIXO_AI_API_KEY || !env?.FLIXO_AI_MODEL) {
    return {
      ok: false,
      status: "brain_not_configured",
      missing: ["FLIXO_AI_API_URL", "FLIXO_AI_API_KEY", "FLIXO_AI_MODEL"],
      message: "Configure provider settings as runtime secrets before enabling the shared AI brain."
    };
  }

  const messages = buildBrainMessages(task, language);
  const response = await fetch(env.FLIXO_AI_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${env.FLIXO_AI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: env.FLIXO_AI_MODEL,
      messages,
      temperature: 0.3,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    return { ok: false, status: "provider_error", httpStatus: response.status, detail };
  }

  const data = await response.json();
  const raw = data?.choices?.[0]?.message?.content;
  if (typeof raw !== "string" || !raw.trim()) {
    return { ok: false, status: "empty_model_response" };
  }

  try {
    return {
      ok: true,
      status: "plan_ready_for_review",
      plan: JSON.parse(raw),
      externalActionTaken: false,
      requiresHumanApproval: true
    };
  } catch {
    return {
      ok: true,
      status: "text_plan_ready_for_review",
      planText: raw,
      externalActionTaken: false,
      requiresHumanApproval: true
    };
  }
}

export const FLIXO_DIVISIONS = DIVISIONS;
