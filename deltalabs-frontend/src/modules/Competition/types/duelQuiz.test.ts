/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import { toAnswerPayload } from "@/modules/Competition/types/integrity";
import type { ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";

/** ################################ /IMPORT ############################# */

/** ################################ TESTS ############################# */

/**
 * Client-side grading (`gradeQuestion` / `normalizeText`) was removed with the
 * answer keys — the whole point of moving scoring server-side. What remains worth
 * pinning is the wire contract: the backend grades plain keys and has no notion
 * of the tagged union, so the tag must be stripped on the way out and every
 * variant must survive the trip.
 */
describe("toAnswerPayload", () => {
  it("strips the kind tag", () => {
    expect(toAnswerPayload({ kind: "multiple_choice", optionId: "b" })).toEqual({
      optionId: "b",
    });
  });

  it("preserves each answer kind's payload keys", () => {
    const cases: Array<[ParticipantAnswer, Record<string, unknown>]> = [
      [{ kind: "true_false", value: false }, { value: false }],
      [{ kind: "fill_blank", text: "Addis Ababa" }, { text: "Addis Ababa" }],
      [{ kind: "fill_blank", answers: ["a", "b"] }, { answers: ["a", "b"] }],
      [{ kind: "matching", map: { p1: "ans_2" } }, { map: { p1: "ans_2" } }],
      [{ kind: "ordering", itemIds: ["i2", "i1"] }, { itemIds: ["i2", "i1"] }],
      [{ kind: "writing", text: "an essay" }, { text: "an essay" }],
      [{ kind: "coding", code: "print(1)" }, { code: "print(1)" }],
      [{ kind: "markdown", text: "# Title" }, { text: "# Title" }],
      [{ kind: "design", text: "a poster" }, { text: "a poster" }],
    ];

    for (const [answer, expected] of cases) {
      expect(toAnswerPayload(answer)).toEqual(expected);
      expect(toAnswerPayload(answer)).not.toHaveProperty("kind");
    }
  });

  it("does not mutate the answer it is given", () => {
    const answer: ParticipantAnswer = { kind: "matching", map: { p1: "ans_1" } };

    toAnswerPayload(answer);

    expect(answer).toEqual({ kind: "matching", map: { p1: "ans_1" } });
  });
});