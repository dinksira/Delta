/**
 * duelQuiz data
 * Builds the participant duel quiz for a topic battle: each authored question
 * on the battle is mapped into a `DuelQuestion` tagged by kind so the
 * participant can answer it exactly as authored.
 *
 * Two things are deliberately absent. There is no subject fallback deck — an
 * invented question cannot be graded by the server, so a battle whose questions
 * fail to map would otherwise be silently graded against nothing. And the
 * leaderboard only ever holds the server-derived standings: `buildDuelQuiz`
 * accepts the real `leaderboard` entries when they are available and otherwise
 * shows just the participant's own row. Nobody's points are invented.
 */

import type {
  DuelLeaderboardEntry,
  DuelQuestion,
  DuelQuiz,
} from "@/modules/Competition/types/duelQuiz";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";
import type {
  TopicBattle,
  TopicBattleLeaderboard,
  TopicBattleQuestion,
} from "@/modules/Competition/types/topicBattle";

/**
 * A question as the participant is allowed to see it, whichever authoring
 * surface produced it.
 *
 * `TopicBattleQuestion` already arrives redacted from the backend.
 * `CodingQuestion` is the Live Duel authoring payload and still carries the
 * full key, so it is projected down here — same rule, enforced at the boundary:
 * pool and prompts survive, the pairing does not.
 */
type PublicQuestionView = TopicBattleQuestion | CodingQuestion;

/** True for the Live Duel authoring payload, which still carries answer keys. */
function isAuthoringPayload(q: PublicQuestionView): q is CodingQuestion {
  return "mcqCorrectId" in q;
}

function matchingPromptsOf(q: PublicQuestionView): { id: string; prompt: string }[] {
  // Already redacted upstream.
  if (!isAuthoringPayload(q)) {
    return q.matchingPrompts ?? [];
  }
  // Column A exists here but carries the pairing, so drop it.
  return q.matchingPairs.map((pair) => ({ id: pair.id, prompt: pair.prompt }));
}

function sampleInputsOf(q: PublicQuestionView): string[] {
  if (!isAuthoringPayload(q)) {
    return q.sampleInputs ?? [];
  }
  return q.testCases.filter((tc) => tc.isSample).map((tc) => tc.input);
}

function blankCountOf(q: PublicQuestionView): number {
  if (!isAuthoringPayload(q)) {
    return q.blankCount ?? 0;
  }
  if (q.fillAnswers.length > 0) {
    return q.fillAnswers.length;
  }
  // Legacy question with no per-blank answers stored: count the stem markers.
  return (q.description ?? "").split("[data-blank]").length - 1;
}

/**
 * Map an authored question (from the backend) into a participant DuelQuestion.
 * Accepts both the topic-battle snapshot (`TopicBattleQuestion`) and the
 * standalone authored payload a Live Duel host posts live (`CodingQuestion`) —
 * they share the same authored surface, so the answering UI and grading rules
 * are identical everywhere.
 */
export function toDuelQuestion(q: PublicQuestionView): DuelQuestion | null {
  const base = {
    id: q.id,
    difficulty: q.difficulty,
    points: q.points || 100,
    hint: q.hintText || undefined,
  };
  const text = q.description || q.title;

  switch (q.kind) {
    case "multiple_choice": {
      const options = (q.mcqOptions ?? []).filter((option) => option.text.trim());
      if (options.length < 2) {
        return null;
      }
      return {
        ...base,
        kind: "multiple_choice",
        text: text || q.title || "Multiple choice question",
        options,
      };
    }
    case "true_false":
      return {
        ...base,
        kind: "true_false",
        text: text || q.title || "True or false statement",
      };
    case "fill_blank":
      return {
        ...base,
        kind: "fill_blank",
        text: text || q.title || "Fill in the blank",
        blankCount: blankCountOf(q),
      };
    case "matching": {
      const answers = (q.matchingAnswers ?? []).filter((a) => a.text.trim());
      // Column B is player-facing so it ships whole, but the `answerId` half of
      // each pair is the answer key and is not on the payload. Prompts are kept;
      // the reveal falls back to the server verdict.
      const pairs = matchingPromptsOf(q)
        .filter((p) => p.prompt.trim())
        .map((p) => ({ id: p.id, prompt: p.prompt }));

      if (answers.length === 0 || pairs.length === 0) {
        return null;
      }
      return {
        ...base,
        kind: "matching",
        text: text || q.title || "Match the pairs",
        answers,
        pairs,
      };
    }
    case "ordering":
      return {
        ...base,
        kind: "ordering",
        text: text || q.title || "Order the items",
        items: q.orderingItems ?? [],
      };
    case "writing":
      return {
        ...base,
        kind: "writing",
        text: text || q.title || "Written response",
      };
    case "markdown":
      return {
        ...base,
        kind: "markdown",
        text: q.title || "Markdown question",
        source: q.markdown?.source ?? "",
      };
    case "design": {
      const design = q.design;
      return {
        ...base,
        kind: "design",
        text: q.title || "Design challenge",
        brief: design?.brief ?? "",
        deliverables: design?.deliverables ?? [],
        coverUrl: design?.cover?.url ?? null,
        canvasWidth: design?.canvasWidth ?? 1080,
        canvasHeight: design?.canvasHeight ?? 1080,
      };
    }
    case "coding":
      return {
        ...base,
        kind: "coding",
        text: text || q.title || "Coding challenge",
        codeTemplate: q.codeTemplate ?? "",
        language: q.language || "HTML",
        constraints: q.constraints || undefined,
        // Only the sample inputs are sent (`sampleInputs`), never the expected
        // output, so cases carry an empty expectation. The inputs are what
        // iterating on a solution locally actually needs.
        testCases: sampleInputsOf(q).map((input) => ({
          input,
          expectedOutput: "",
        })),
      };
    default:
      return null;
  }
}

/** Resolve the full participant quiz for the given battle. */
export function buildDuelQuiz(
  battle: TopicBattle,
  leaderboard: DuelLeaderboardEntry[] = [],
): DuelQuiz {
  const questions = (battle.questions ?? [])
    .map(toDuelQuestion)
    .filter((q): q is DuelQuestion => q !== null);

  return {
    battleId: battle.id,
    battleTitle: battle.title,
    questions,
    leaderboard: leaderboard.length > 0 ? leaderboard : buildLeaderboard(),
    playerCount: battle.playersJoined,
  };
}

/**
 * The participant's own row only, with a zero starting score. Used until the
 * real server standings arrive; the template overlays the live server score onto
 * it as answers are graded, so nothing shown here is ever a made-up number.
 */
function buildLeaderboard(): DuelLeaderboardEntry[] {
  return [{ rank: 1, name: "You", points: 0, isCurrentUser: true }];
}

/** Map the backend's server standings onto the duel view's entry shape. */
export function toDuelLeaderboardEntries(
  board: TopicBattleLeaderboard | undefined,
  currentUserId: string | null,
): DuelLeaderboardEntry[] {
  return (board?.entries ?? []).map((entry) => ({
    rank: entry.rank,
    name: entry.userId === currentUserId ? "You" : entry.name,
    avatarUrl: entry.avatarUrl ?? undefined,
    points: entry.points,
    isCurrentUser: entry.userId === currentUserId,
    userId: entry.userId,
  }));
}

/**
 * Overlay the participant's live server score onto the standings and re-rank.
 *
 * The rows the server reported keep their real points (and their order); the
 * participant's own row is updated in place, or appended when they have not
 * finished yet. Ranks are recomputed with the same dense ranking the server
 * uses, so a provisional row never invents a place out of thin air.
 */
export function mergeLiveLeaderboard(
  entries: DuelLeaderboardEntry[],
  score: number,
): DuelLeaderboardEntry[] {
  const rows = entries.map((entry) => (entry.isCurrentUser ? { ...entry, points: score } : entry));
  if (!rows.some((entry) => entry.isCurrentUser)) {
    rows.push({ rank: 0, name: "You", points: score, isCurrentUser: true });
  }
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  let previousPoints: number | null = null;
  let rank = 0;
  return sorted.map((row) => {
    if (row.points !== previousPoints) {
      rank += 1;
      previousPoints = row.points;
    }
    return { ...row, rank };
  });
}
