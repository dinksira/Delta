/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import {
  gradeQuestion,
  normalizeText,
  type DuelQuestion,
  type ParticipantAnswer,
} from "@/modules/Competition/types/duelQuiz";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Auto-grading rules for objective duel questions. */
describe("normalizeText", () => {
  it("trims, lowercases, and collapses inner whitespace", () => {
    expect(normalizeText("  Addis   Ababa ")).toBe("addis ababa");
  });
});

describe("gradeQuestion", () => {
  const fillBlank: DuelQuestion = {
    id: "q1",
    kind: "fill_blank",
    text: "The capital of Ethiopia is ____.",
    expected: "Addis Ababa",
    answers: [],
    difficulty: "EASY",
    points: 100,
  };

  const answers: Record<string, ParticipantAnswer> = {
    exact: { kind: "fill_blank", text: "Addis Ababa" },
    caseInsensitive: { kind: "fill_blank", text: "addis ababa" },
    extraWhitespace: { kind: "fill_blank", text: "  Addis   Ababa  " },
    wrong: { kind: "fill_blank", text: "Cairo" },
    empty: { kind: "fill_blank", text: "" },
  };

  it("grades a matching fill_blank as correct", () => {
    expect(gradeQuestion(fillBlank, answers.exact)).toBe(true);
    expect(gradeQuestion(fillBlank, answers.caseInsensitive)).toBe(true);
    expect(gradeQuestion(fillBlank, answers.extraWhitespace)).toBe(true);
  });

  it("grades a non-matching fill_blank as incorrect", () => {
    expect(gradeQuestion(fillBlank, answers.wrong)).toBe(false);
  });

  it("does not auto-grade a fill_blank without an authored expected answer", () => {
    const noKey: DuelQuestion = { ...fillBlank, expected: "" };
    expect(gradeQuestion(noKey, answers.exact)).toBeNull();
  });

  it("returns null for a null answer", () => {
    expect(gradeQuestion(fillBlank, null)).toBeNull();
  });

  it("requires every blank to match in multi-blank mode", () => {
    const multi: DuelQuestion = {
      ...fillBlank,
      text: "The <b>quick</b> ____ fox ____ over the ____ dog.",
      expected: "",
      answers: ["quick", "jumps", "lazy"],
    };
    const correct = {
      kind: "fill_blank" as const,
      answers: ["Quick", "  jumps ", "lazy"],
    };
    expect(gradeQuestion(multi, correct)).toBe(true);

    const oneWrong = {
      kind: "fill_blank" as const,
      answers: ["quick", "sleeps", "lazy"],
    };
    expect(gradeQuestion(multi, oneWrong)).toBe(false);
  });

  it("does not auto-grade multi-blank when the answer length mismatches", () => {
    const multi: DuelQuestion = {
      ...fillBlank,
      text: "____ ____ ____",
      expected: "",
      answers: ["a", "b", "c"],
    };
    const partial = { kind: "fill_blank" as const, answers: ["a", "b"] };
    expect(gradeQuestion(multi, partial)).toBeNull();
  });

  it("grades a matching answer by pool answer id", () => {
    const matching: DuelQuestion = {
      id: "q2",
      kind: "matching",
      text: "Match the country to its capital.",
      difficulty: "EASY",
      points: 100,
      answers: [
        { id: "a1", text: "Addis Ababa" },
        { id: "a2", text: "Nairobi" },
        { id: "a3", text: "Cairo" },
      ],
      pairs: [
        { id: "p1", prompt: "Ethiopia", answerId: "a1" },
        { id: "p2", prompt: "Kenya", answerId: "a2" },
        { id: "p3", prompt: "Egypt", answerId: "a3" },
      ],
    };
    const allCorrect: ParticipantAnswer = {
      kind: "matching",
      map: { p1: "a1", p2: "a2", p3: "a3" },
    };
    expect(gradeQuestion(matching, allCorrect)).toBe(true);

    const oneWrong: ParticipantAnswer = {
      kind: "matching",
      map: { p1: "a1", p2: "a1", p3: "a3" },
    };
    expect(gradeQuestion(matching, oneWrong)).toBe(false);
  });

  it("does not grade a matching answer that leaves pairs unassigned", () => {
    const matching: DuelQuestion = {
      id: "q2",
      kind: "matching",
      text: "Match the country to its capital.",
      difficulty: "EASY",
      points: 100,
      answers: [{ id: "a1", text: "Addis Ababa" }],
      pairs: [{ id: "p1", prompt: "Ethiopia", answerId: "a1" }],
    };
    const missing: ParticipantAnswer = { kind: "matching", map: {} };
    expect(gradeQuestion(matching, missing)).toBe(false);
  });
});
/** ################################ /COMPONENT ############################# */
