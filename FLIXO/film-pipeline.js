/**
 * FLIXO AI — long-form film planning foundation.
 *
 * This module prepares a structured production plan. It does NOT generate
 * video, call an AI provider, render audio, or assemble an MP4 yet.
 *
 * Usage (Node.js):
 *   import { createFilmPlan } from "./film-pipeline.js";
 *   const plan = createFilmPlan({ title, premise, genre, durationMinutes, characters });
 */

const ALLOWED_DURATIONS = new Set([5, 10, 15, 20, 30]);
const DEFAULT_SCENE_SECONDS = 15;
const MAX_SCENE_SECONDS = 60;
const MIN_SCENE_SECONDS = 5;

function requiredText(value, field, maxLength = 4000) {
  if (typeof value !== "string" || !value.trim()) {
    throw new TypeError(`${field} must be a non-empty string.`);
  }
  const normalized = value.trim();
  if (normalized.length > maxLength) {
    throw new RangeError(`${field} must be ${maxLength} characters or fewer.`);
  }
  return normalized;
}

function normalizeCharacters(characters = []) {
  if (!Array.isArray(characters) || characters.length > 20) {
    throw new TypeError("characters must be an array with at most 20 entries.");
  }
  const seen = new Set();
  return characters.map((character, index) => {
    const name = requiredText(character?.name, `characters[${index}].name`, 80);
    const key = name.toLocaleLowerCase();
    if (seen.has(key)) throw new Error(`Duplicate character name: ${name}`);
    seen.add(key);
    return {
      id: `char_${index + 1}`,
      name,
      description: requiredText(character?.description, `characters[${index}].description`, 1000),
      visualContinuity: requiredText(
        character?.visualContinuity || character?.description,
        `characters[${index}].visualContinuity`,
        1000
      )
    };
  });
}

/**
 * Create an exact-duration scene schedule for a film.
 * Scenes are planning units; a later generation adapter will render each one.
 */
export function createFilmPlan(input = {}) {
  const title = requiredText(input.title, "title", 160);
  const premise = requiredText(input.premise, "premise", 4000);
  const genre = requiredText(input.genre, "genre", 80);
  const durationMinutes = Number(input.durationMinutes ?? 30);

  if (!ALLOWED_DURATIONS.has(durationMinutes)) {
    throw new RangeError(`durationMinutes must be one of: ${[...ALLOWED_DURATIONS].join(", ")}.`);
  }

  const sceneSeconds = Number(input.sceneSeconds ?? DEFAULT_SCENE_SECONDS);
  if (!Number.isInteger(sceneSeconds) ||
      sceneSeconds < MIN_SCENE_SECONDS ||
      sceneSeconds > MAX_SCENE_SECONDS) {
    throw new RangeError(`sceneSeconds must be an integer from ${MIN_SCENE_SECONDS} to ${MAX_SCENE_SECONDS}.`);
  }

  const characters = normalizeCharacters(input.characters);
  const totalSeconds = durationMinutes * 60;
  const sceneCount = Math.ceil(totalSeconds / sceneSeconds);
  const baseSeconds = Math.floor(totalSeconds / sceneCount);
  const extraSeconds = totalSeconds % sceneCount;

  const acts = [
    { id: "act_1", name: "Setup", startRatio: 0, endRatio: 0.25 },
    { id: "act_2", name: "Rising action", startRatio: 0.25, endRatio: 0.5 },
    { id: "act_3", name: "Climax", startRatio: 0.5, endRatio: 0.8 },
    { id: "act_4", name: "Resolution", startRatio: 0.8, endRatio: 1 }
  ];

  let cursor = 0;
  const scenes = Array.from({ length: sceneCount }, (_, index) => {
    const durationSeconds = baseSeconds + (index < extraSeconds ? 1 : 0);
    const startSeconds = cursor;
    cursor += durationSeconds;
    const midpoint = (startSeconds + durationSeconds / 2) / totalSeconds;
    const act = acts.find(item => midpoint >= item.startRatio && midpoint < item.endRatio)
      || acts[acts.length - 1];

    return {
      id: `scene_${String(index + 1).padStart(3, "0")}`,
      number: index + 1,
      actId: act.id,
      actName: act.name,
      startSeconds,
      durationSeconds,
      endSeconds: cursor,
      storyBeat: "",
      location: "",
      action: "",
      dialogue: [],
      characterIds: [],
      visualPrompt: "",
      audioNotes: "",
      continuityNotes: ""
    };
  });

  return {
    schemaVersion: "1.0.0",
    status: "planning",
    title,
    premise,
    genre,
    language: requiredText(input.language || "en", "language", 20),
    durationMinutes,
    totalSeconds,
    targetSceneSeconds: sceneSeconds,
    sceneCount,
    characters,
    acts,
    scenes,
    production: {
      videoProvider: null,
      audioProvider: null,
      editingEngine: null,
      exportFormat: "mp4",
      generationStatus: "not_connected"
    },
    limitations: [
      "This plan is not a rendered film.",
      "Video generation, audio generation, editing, and MP4 export require provider integrations."
    ]
  };
}

/**
 * Build a consistent scene prompt from a planned scene and the film bible.
 * Character descriptions are repeated to help preserve visual identity.
 */
export function buildScenePrompt(plan, scene) {
  if (!plan || !Array.isArray(plan.characters) || !scene) {
    throw new TypeError("A film plan and scene are required.");
  }
  const selected = new Set(scene.characterIds || []);
  const cast = plan.characters
    .filter(character => selected.has(character.id))
    .map(character => `${character.name}: ${character.visualContinuity}`)
    .join("\n");

  return [
    `Film: ${plan.title}`,
    `Genre: ${plan.genre}`,
    `Scene ${scene.number} of ${plan.sceneCount}; duration: ${scene.durationSeconds} seconds.`,
    cast ? `Character continuity:\n${cast}` : "No named characters assigned yet.",
    scene.location ? `Location: ${scene.location}` : "",
    scene.action ? `Action: ${scene.action}` : "",
    scene.visualPrompt ? `Visual direction: ${scene.visualPrompt}` : "",
    scene.continuityNotes ? `Continuity: ${scene.continuityNotes}` : "",
    "Maintain consistent character identity, costume, proportions, and screen direction."
  ].filter(Boolean).join("\n");
}
