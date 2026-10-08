/**
 * duelQuiz types
 * TypeScript definitions for the post-join topic battle duel.
 *
 * A duel is built from the battle's authored questions (`battle.questions`). Each
 * question is tagged with a `kind` that selects the answering UI:
 *
 * - `multiple_choice` / `true_false` / `fill_blank` / `matching` / `ordering`
 *   are auto-graded by the server after submission.
 * - `writing` / `coding` / `markdown` / `design` accept a free-form / code answer
 *   that the server records for human review without scoring.
 *
 * No question here carries its answer key. Grading moved server-side in Phase 2:
 * previously the backend shipped `mcqCorrectId`, `tfAnswer`, `fillExpected` and
 * friends to every participant and `gradeQuestion` decided "correct" in the
 * browser, which meant a paid competition's result was decided by the client
 * that wanted to win. Verdicts now arrive from
 * `POST /v1/competitions/topic-battles/{id}/answers`, and the post-submit reveal
 * is driven by that boolean plus the player's own choice — see
 * `types/integrity.ts`.
 *
 * Matching grades by answer id, so the Column B pool is the source of truth; only
 * the `answerId` half of each pair is withheld from the client.
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
    })
  | (DuelQuestionBase & { kind: "true_false" })
  | (DuelQuestionBase & {
      kind: "fill_blank";
      /**
       * Number of `[data-blank]` markers in the stem. Structure, not key — the
       * participant needs it to know how many inputs to render. The accepted
       * values per blank are never sent.
       */
      blankCount: number;
    })
  | (DuelQuestionBase & {
      kind: "matching";
      /** Column B answer pool the player picks from. */
      answers: DuelMatchingAnswer[];
      /**
       * Column A prompts only. The `answerId` half of each pair is the answer
       * key and is no longer sent to the client, so the reveal is driven by the
       * server verdict instead of by matching against this list.
       */
      pairs: Omit<DuelMatchingPair, "answerId">[];
    })
  | (DuelQuestionBase & { kind: "ordering"; items: DuelOrderingItem[] })
  | (DuelQuestionBase & { kind: "writing" })
  | (DuelQuestionBase & {
      kind: "coding";
      codeTemplate: string;
      language: string;
      /** LeetCode-style constraints section, shown under the problem text. */
      constraints?: string;
      /** Sample test cases shown to the player before coding. */
      testCases: DuelTestCase[];
    })
  | (DuelQuestionBase & {
      kind: "markdown";
      /** Authored markdown source rendered to the player as the question body. */
      source: string;
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
  /** Backend user id so live-duel rooms can mark the current user's row. */
  userId?: string;
}

export interface DuelQuiz {
  battleId: string;
  battleTitle: string;
  questions: DuelQuestion[];
  leaderboard: DuelLeaderboardEntry[];
  /** Real joined count from the battle, for the header's player badge. */
  playerCount: number;
}

export interface DuelState {
  currentQuestionIndex: number;
  /** The submitted answer for the current question, once locked in. */
  answer: ParticipantAnswer | null;
  /** `true` once the server has returned a verdict for the current question. */
  isAnswered: boolean;
  /** `true` while the answer is awaiting a server verdict. */
  isSubmitting: boolean;
  /**
   * Server verdict for the last submitted answer: true/false, or `null` when
   * the kind is subjective or the answer arrived past the deadline. Authoritative
   * — this is what the score is derived from.
   */
  lastResult: boolean | null;
  score: number;
  rank: number;
  correctCount: number;
  totalQuestions: number;
}

