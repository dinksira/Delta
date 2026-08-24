/**
 * duelQuiz types
 * TypeScript definitions for the post-join topic battle duel.
 *
 * A duel is built from the battle's authored questions (`battle.questions`) or,
 * when a battle has none, from curated subject decks. Each question is tagged
 * with a `kind` that selects the answering UI and the auto-grading rule:
 *
 * - `multiple_choice` / `true_false` / `fill_blank` / `matching` / `ordering`
 *   are auto-graded (objective kinds). Matching grades by answer-id so the
 *   Column B pool is the source of truth. A `fill_blank` without an authored
 *   expected answer is not auto-graded.
 * - `writing` / `coding` accept a free-form / code answer that is recorded but
 *   not auto-scored (no code executor / rubric).
 * - `markdown` / `design` render the authored Markdown Pad / Design Canvas brief
 *   to the player; the free-form answer is recorded for human review.
 */

import type { QuestionKind } from "@/modules/Competition/types/createBattle";

export interface DuelMcqOption {
  id: string;
  label: string;
  text: string;
}

export interface DuelMatchingAnswer {
  id: string;
  text: string;
}

export interface DuelMatchingPair {
  id: string;
  prompt: string;
  /** References a `DuelMatchingAnswer` in `answers` (Column B pool). */
  answerId: string;
}

export interface DuelOrderingItem {
  id: string;
  text: string;
}

/** A sample test case shown to the player for a coding question. */
export interface DuelTestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
}

interface DuelQuestionBase {
  id: string;
  kind: QuestionKind;
  /** Stem / question text shown to the player. */
  text: string;
  difficulty: string;
  points: number;
  hint?: string;
}

export type DuelQuestion =
  | (DuelQuestionBase & {
      kind: "multiple_choice";
      options: DuelMcqOption[];
      correctId: string;
    })
  | (DuelQuestionBase & { kind: "true_false"; correct: boolean })
  | (DuelQuestionBase & {
      kind: "fill_blank";
      /** Legacy whole-sentence answer key (no stem blanks authored). */
      expected: string;
      /** One answer per blank marker in the stem, in stem order. */
      answers: string[];
    })
  | (DuelQuestionBase & {
      kind: "matching";
      /** Column B answer pool the player picks from. */
      answers: DuelMatchingAnswer[];
      pairs: DuelMatchingPair[];
    })
  | (DuelQuestionBase & { kind: "ordering"; items: DuelOrderingItem[] })
  | (DuelQuestionBase & { kind: "writing" })
  | (DuelQuestionBase & {
      kind: "coding";
      codeTemplate: string;
      language: string;
      /** LeetCode-style constraints section, shown under the problem text. */
      constraints?: string;
      /** Sample (non-hidden) test cases shown to the player before coding. */
      testCases: DuelTestCase[];
    })
  | (DuelQuestionBase & {
      kind: "markdown";
      /** Authored markdown source rendered to the player as the question body. */
      source: string;
      /** Human-grading notes / rubric (not shown to the player). */
      rubric?: string;
    })
  | (DuelQuestionBase & {
      kind: "design";
      /** Rich-HTML design brief shown to the player. */
      brief: string;
      /** Ordered design deliverables the submission should meet. */
      deliverables: string[];
      /** Resolved cover / reference image URL, when one is set. */
      coverUrl?: string | null;
      /** Authored canvas dimensions in px the design should match. */
      canvasWidth: number;
      canvasHeight: number;
      /** Human-grading notes / rubric (not shown to the player). */
      rubric?: string;
    });

/** The player's answer for a single question, keyed by kind. */
export type ParticipantAnswer =
  | { kind: "multiple_choice"; optionId: string }
  | { kind: "true_false"; value: boolean }
  | { kind: "fill_blank"; text: string }
  | { kind: "fill_blank"; answers: string[] }
  | { kind: "matching"; map: Record<string, string> }
  | { kind: "ordering"; itemIds: string[] }
  | { kind: "writing"; text: string }
  | { kind: "coding"; code: string }
  | { kind: "markdown"; text: string }
  | { kind: "design"; text: string };

export interface DuelLeaderboardEntry {
  rank: number;
  name: string;
  avatarUrl?: string;
  points: number;
  isCurrentUser?: boolean;
}

export interface DuelQuiz {
  battleId: string;
  battleTitle: string;
  questions: DuelQuestion[];
  leaderboard: DuelLeaderboardEntry[];
}

export interface DuelState {
  currentQuestionIndex: number;
  /** The submitted answer for the current question, once locked in. */
  answer: ParticipantAnswer | null;
  isAnswered: boolean;
  /** Result of the last submitted answer: true/false, or null when not auto-graded. */
  lastResult: boolean | null;
  score: number;
  rank: number;
  correctCount: number;
  totalQuestions: number;
}

/** Normalize a string for forgiving text comparison. */
export function normalizeText(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Auto-grade an objective-kind answer. Returns `null` for kinds without an
 * auto-judge (writing / coding).
 */
export function gradeQuestion(
  question: DuelQuestion,
  answer: ParticipantAnswer | null,
): boolean | null {
  if (!answer) {
    return null;
  }
  switch (question.kind) {
    case "multiple_choice": {
      if (answer.kind !== "multiple_choice") return null;
      return answer.optionId === question.correctId && question.correctId !== "";
    }
    case "true_false": {
      if (answer.kind !== "true_false") return null;
      return answer.value === question.correct;
    }
    case "fill_blank": {
      if (answer.kind !== "fill_blank") return null;
      // Multi-blank mode: the stem carries `[data-blank]` markers and the
      // author keyed one answer per blank. Every blank must match.
      if (question.answers.length > 0) {
        if (!("answers" in answer)) return null;
        if (question.answers.length !== answer.answers.length) return null;
        return question.answers.every(
          (expected, index) => normalizeText(answer.answers[index]) === normalizeText(expected),
        );
      }
      // Legacy whole-sentence mode (no stem blanks authored).
      const expected = normalizeText(question.expected);
      // No authored answer key -> not auto-graded (mirrors writing / coding).
      if (!expected) return null;
      if (!("text" in answer)) return null;
      return normalizeText(answer.text) === expected;
    }
    case "matching": {
      if (answer.kind !== "matching") return null;
      return question.pairs.every((pair) => answer.map[pair.id] === pair.answerId);
    }
    case "ordering": {
      if (answer.kind !== "ordering") return null;
      const authored = question.items.map((item) => item.id);
      return (
        authored.length === answer.itemIds.length &&
        authored.every((id, index) => id === answer.itemIds[index])
      );
    }
    case "writing":
    case "coding":
    case "markdown":
    case "design":
      return null;
    default:
      return null;
  }
}
