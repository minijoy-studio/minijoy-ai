/**
 * FLIXO 100 AI — safe task router prototype
 * This is a routing prototype, not 100 live AI agents and not an income bot.
 * It classifies incoming work and proposes a team. It never trades, moves money,
 * contacts prospects, or makes purchases.
 */
const TEAM_KEYWORDS = {
  video: ["video","film","animation","cartoon","story","scene","voiceover","subtitle","edit","montage"],
  sales: ["client","customer","lead","prospect","sell","sales","proposal","offer","follow-up","заказчик","клиент","продажа"],
  design: ["design","logo","banner","advert","ad","brand","poster","дизайн","реклама","логотип"],
  social: ["instagram","youtube","tiktok","shorts","caption","hashtag","content","соцсет","публикац"],
  operations: ["budget","cost","revenue","expense","risk","security","workflow","report","финанс","расход","доход","риск"]
};

export function routeTask(task) {
  if (typeof task !== "string" || !task.trim()) {
    return { ok: false, error: "A non-empty task description is required." };
  }
  const normalized = task.toLowerCase();
  const scores = Object.fromEntries(Object.entries(TEAM_KEYWORDS).map(([team, words]) => [
    team, words.reduce((score, word) => score + (normalized.includes(word) ? 1 : 0), 0)
  ]));
  const [team, score] = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
  if (!score) {
    return { ok: true, mode: "manual_review", proposedTeam: "operations", reason: "No clear team match; human review required.", requiresHumanApproval: true };
  }
  return {
    ok: true,
    mode: "draft_assignment",
    proposedTeam: team,
    reason: "Keyword-based prototype routing; verify before execution.",
    requiresHumanApproval: true,
    externalActionTaken: false
  };
}
