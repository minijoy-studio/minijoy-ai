/**
 * FLIXO shared AI brain — OpenAI Responses API adapter.
 * Keep API credentials in Cloudflare Worker secrets, never in browser code or Git.
 */
const DIVISIONS = [
  "video and animation", "sales and customer acquisition",
  "graphic design and advertising", "social media and publishing",
  "e-commerce and online stores", "writing and documentation",
  "translation and localization", "education and learning",
  "audio and voice services", "websites, analytics and operations"
];
const MAX_TASK_CHARS = 8000;

export function buildBrainMessages(task, language = "ru") {
  if (typeof task !== "string" || !task.trim()) throw new Error("A non-empty task description is required.");
  if (task.length > MAX_TASK_CHARS) throw new Error(\`Task is too long; maximum is \${MAX_TASK_CHARS} characters.\`);
  const system = [
    "You are the shared planning brain for FLIXO, a global digital-services workbench.",
    "Choose the best lawful, non-harmful specialist division.",
    \`Existing divisions: \${DIVISIONS.join("; ")}.\`,
    "Return concise JSON with keys: language, opportunity, customer, deliverable, recommendedDivision, specialistRoles (array), steps (array), estimatedEffort, risks (array), humanApprovalRequired, revenueModel, nextAction, youtubePlan (object or null).",
    "For MINIJOY and YouTube tasks, include audience fit, episode titles, description, thumbnail brief, Shorts ideas and a realistic calendar. Keep children’s content age-appropriate and mention the Made for Kids designation when applicable.",
    "Only draft plans and content. Never publish, message customers, spend money, transfer funds, or claim earnings or customers without evidence.",
    "Never ask for passwords, card details, CVV, PINs, private keys, or one-time codes.",
    "Flag expert review for regulated or high-risk topics. Use the requested response language."
  ].join(" ");
  return [
    { role: "system", content: system },
    { role: "user", content: \`Response language: \${language}.\\nTask/opportunity:\\n\${task.trim()}\` }
  ];
}

function extractOutputText(data) {
  if (typeof data?.output_text === "string" && data.output_text.trim()) return data.output_text.trim();
  const parts = [];
  for (const item of data?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") parts.push(content.text);
    }
  }
  return parts.join("\\n").trim();
}

export async function think(task, env, language = "ru") {
  if (!env?.FLIXO_AI_API_URL || !env?.FLIXO_AI_API_KEY || !env?.FLIXO_AI_MODEL) {
    return { ok: false, status: "brain_not_configured", missing: ["FLIXO_AI_API_URL", "FLIXO_AI_API_KEY", "FLIXO_AI_MODEL"], message: "Configure provider settings as runtime secrets." };
  }
  const messages = buildBrainMessages(task, language);
  const response = await fetch(env.FLIXO_AI_API_URL, {
    method: "POST",
    headers: { "Authorization": \`Bearer \${env.FLIXO_AI_API_KEY}\`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: env.FLIXO_AI_MODEL,
      input: messages,
      text: { format: { type: "json_object" } },
      temperature: 0.3
    })
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 1000);
    return { ok: false, status: "provider_error", httpStatus: response.status, detail };
  }
  const data = await response.json();
  const raw = extractOutputText(data);
  if (!raw) return { ok: false, status: "empty_model_response" };
  try {
    return { ok: true, status: "plan_ready_for_review", plan: JSON.parse(raw), externalActionTaken: false, requiresHumanApproval: true };
  } catch {
    return { ok: true, status: "text_plan_ready_for_review", planText: raw, externalActionTaken: false, requiresHumanApproval: true };
  }
}
export const FLIXO_DIVISIONS = DIVISIONS;
