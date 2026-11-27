/**
 * FLIXO 1000 AI — AI Director for the first two pilot specialists.
 *
 * The Director interprets the owner's instruction and proposes a task assignment.
 * It does not execute external actions. A human must approve the assignment
 * before runApprovedAssignment() is called by a trusted server endpoint.
 */
import { think } from "./brain.js";
import {
  runSocialMediaContentPlanner,
  runProductDescriptionWriter
} from "./specialists.js";

const MAX_COMMAND_CHARS = 6000;
const ALLOWED_SPECIALISTS = new Set(["pilot-002", "pilot-004"]);

function validateCommand(command) {
  if (typeof command !== "string" || !command.trim()) {
    throw new Error("A non-empty owner command is required.");
  }
  if (command.length > MAX_COMMAND_CHARS) {
    throw new Error(`Command is too long; maximum is ${MAX_COMMAND_CHARS} characters.`);
  }
  return command.trim();
}

/**
 * Turn a natural-language owner command into a reviewable assignment proposal.
 * This is planning only: no specialist is run and no external action is taken.
 */
export async function planOwnerCommand({ command, language = "ru", env }) {
  const safeCommand = validateCommand(command);
  const prompt = [
    "You are the AI Director of FLIXO 1000 AI. You report to the human owner.",
    "Your current pilot team has exactly two callable specialist workflows:",
    "pilot-002: Social Media Content Planner — seven-day content calendars, hooks, captions, calls to action, visual briefs.",
    "pilot-004: Product Description Writer — product listing titles and descriptions grounded in supplied product facts.",
    "Interpret the owner's command and choose one specialist only if the task clearly fits. If it does not fit, set specialistId to null and request clarification or manual handling.",
    "Never invent that a specialist completed work, found customers, earned money, or sent anything.",
    "Return valid JSON with keys: commandSummary, specialistId (pilot-002, pilot-004, or null), taskBrief, whyThisSpecialist, missingInformation (array), riskNotes (array), ownerApprovalRequired (boolean), nextStep.",
    "This is a proposal only. Do not execute the assignment, contact customers, publish, spend money, or process payments.",
    `Owner command:\n${safeCommand}`
  ].join("\n\n");

  const result = await think(prompt, env, language);
  if (!result.ok) return result;

  const plan = result.plan;
  if (plan && !ALLOWED_SPECIALISTS.has(plan.specialistId)) {
    plan.specialistId = null;
    plan.ownerApprovalRequired = true;
    plan.nextStep = "Manual review or clarification required; no specialist was assigned.";
  }
  if (plan) plan.ownerApprovalRequired = true;

  return {
    ...result,
    plan,
    status: result.status === "plan_ready_for_review"
      ? "director_proposal_ready_for_owner_review"
      : result.status,
    externalActionTaken: false,
    requiresHumanApproval: true
  };
}

/**
 * Run only after the owner has explicitly approved a valid proposal.
 * The caller must enforce authentication and approval on the server.
 */
export async function runApprovedAssignment({ approval, specialistId, brief, language = "ru", env }) {
  if (approval !== true) {
    return { ok: false, status: "approval_required", externalActionTaken: false };
  }
  const safeBrief = validateCommand(brief);
  if (specialistId === "pilot-002") {
    return runSocialMediaContentPlanner({ brief: safeBrief, language, env });
  }
  if (specialistId === "pilot-004") {
    return runProductDescriptionWriter({ brief: safeBrief, language, env });
  }
  return {
    ok: false,
    status: "unknown_or_unavailable_specialist",
    externalActionTaken: false
  };
}

export const DIRECTOR_CAPABILITIES = {
  role: "AI Director",
  reportsTo: "Human owner",
  canProposeAssignments: true,
  availableSpecialists: ["pilot-002", "pilot-004"],
  canExecuteWithoutApproval: false,
  canContactCustomers: false,
  canPublish: false,
  canSpendMoney: false,
  canProcessPayments: false
};
