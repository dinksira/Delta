/**
 * integrity — types for server-graded topic-battle answers and proctoring signals.
 *
 * Scoring moved server-side in Phase 2, so these types describe a *verdict that
 * comes back* rather than an answer that gets graded locally. The consequence
 * that matters: `DuelQuestion` no longer carries answer keys, so the player
 * cannot know the right answer before submitting, and the reveal after
 * submission is driven by the boolean verdict plus their own choice.
 *
 * @example
 * ```ts
 * const result = await submitTopicBattleAnswer({ battleId, questionId, answer, latencyMs });
 * result.correct; // true | false | null when parked for human review
 * ```
 */

import type { ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";

/** A proctoring signal the client can observe. */
export type IntegrityEventType =
  /** The tab was hidden or the page was backgrounded. */
  | "tab_hidden"
  /** The window lost focus (alt-tab, another app, screen lock). */
  | "window_blur"
  /** Fullscreen was exited mid-attempt. */
  | "fullscreen_exit"
  /** Something was pasted into an answer field. */
  | "answer_pasted"
  /** A copy was attempted (weaker signal; copies are legitimate). */
  | "copy_attempt"
  /** Focus returned. Recorded for context; not a violation. */
  | "focus_gain";

/** Server verdict for a single submitted answer. */
export interface TopicBattleAnswerResult {
  questionId: string;
  /**
   * `true`/`false` for auto-graded kinds, `null` when the answer is subjective
   * (writing / coding / markdown / design) or arrived after the deadline and is
   * awaiting human review.
   */
  correct: boolean | null;
  /** Points earned by this answer. */
  earnedPoints: number;
  /** Running total across the battle. */
  totalPoints: number;
  correctCount: number;
  /** Answers recorded so far, including this one. */
  answeredCount: number;
  /** `true` while at least one submitted answer awaits human review. */
  pendingReview: boolean;
  /** `true` when the server rejected the answer as past the deadline. */
  pastDeadline: boolean;
}

/** Acknowledgement for a proctoring signal. */
export interface IntegrityEventResult {
  recorded: boolean;
  /** Violations accumulated so far. Non-violation signals report 0. */
  violationCount: number;
  /** `true` once the count reached the server's review threshold. */
  autoFlagged: boolean;
}

/**
 * Flatten a tagged `ParticipantAnswer` into the wire payload the backend grades.
 *
 * The backend reads plain keys (`optionId`, `value`, `answers`, `map`,
 * `itemIds`, `text`, `code`) so it never has to understand this module's tagged
 * union. Sending the tag too would be harmless but pointless, and dropping it
 * here keeps the request shape stable if the union grows a new member.
 */
export function toAnswerPayload(answer: ParticipantAnswer): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...answer };
  delete payload.kind;
  return payload;
}