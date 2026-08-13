/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import { buildDuelQuiz } from "@/modules/Competition/data/duelQuiz";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Coding questions map onto the participant duel with constraints + samples. */
describe("buildDuelQuiz (coding)", () => {
  const battle: TopicBattle = {
    id: "b1",
    title: "Code Battle",
    subject: "Programming",
    difficulty: "Mixed",
    status: "open",
    countdownEndsAt: null,
    creator: { name: "Host" },
    ownerUserId: null,
    isOwner: true,
    hasJoined: true,
    hasCompleted: false,
    prizePool: "0 ETB",
    entryFee: "Free",
    playersJoined: 1,
    playersMax: 2,
    format: "mini",
    durationMinutes: 10,
    visibility: "public",
    timing: "instant",
    prizeRule: "winner-takes-all",
    questionPoolMode: "custom",
    scheduleDate: "",
    scheduleTime: "",
    scheduleTimezone: "UTC",
    easyPct: 0,
    mediumPct: 0,
    hardPct: 0,
    createdAt: "2026-01-01T00:00:00Z",
    questions: [
      {
        id: "q1",
        title: "Two Sum",
        description: "Find the pair that sums to the target.",
        constraints: "1 ≤ nums.length ≤ 10⁴",
        codeTemplate: "function twoSum(nums, target) {}",
        language: "JavaScript",
        difficulty: "EASY",
        timeLimitMinutes: 10,
        points: 1,
        hintEnabled: true,
        hintText: "",
        testCases: [
          { input: "[2,7,11,15], 9", expectedOutput: "[0,1]", explanation: "Example 1", isSample: true, isHidden: false },
          { input: "[3,2,4], 6", expectedOutput: "[1,2]", explanation: "", isSample: false, isHidden: true },
        ],
        kind: "coding",
        mcqOptions: [],
        mcqCorrectId: "",
        tfAnswer: true,
        fillExpected: "",
        matchingAnswers: [],
        matchingPairs: [],
        orderingItems: [],
      },
    ],
  };

  it("maps constraints and only sample test cases to the duel question", () => {
    const duel = buildDuelQuiz(battle);
    expect(duel.questions).toHaveLength(1);
    const coding = duel.questions[0];
    expect(coding.kind).toBe("coding");
    if (coding.kind !== "coding") {
      throw new Error("expected coding question");
    }
    expect(coding.constraints).toBe("1 ≤ nums.length ≤ 10⁴");
    expect(coding.codeTemplate).toBe("function twoSum(nums, target) {}");
    expect(coding.language).toBe("JavaScript");
    expect(coding.testCases).toEqual([{ input: "[2,7,11,15], 9", expectedOutput: "[0,1]", explanation: "Example 1" }]);
  });
});
/** ################################ /COMPONENT ############################# */

/** ################################ COMPONENT ############################# */
/** Markdown Pad and Design Canvas questions render their payload to participants. */
describe("buildDuelQuiz (markdown / design)", () => {
  const baseBattle: Omit<TopicBattle, "questions"> = {
    id: "b2",
    title: "Makers Battle",
    subject: "Design",
    difficulty: "Mixed",
    status: "open",
    countdownEndsAt: null,
    creator: { name: "Host" },
    ownerUserId: null,
    isOwner: true,
    hasJoined: true,
    hasCompleted: false,
    prizePool: "0 ETB",
    entryFee: "Free",
    playersJoined: 1,
    playersMax: 2,
    format: "mini",
    durationMinutes: 10,
    visibility: "public",
    timing: "instant",
    prizeRule: "winner-takes-all",
    questionPoolMode: "custom",
    scheduleDate: "",
    scheduleTime: "",
    scheduleTimezone: "UTC",
    easyPct: 0,
    mediumPct: 0,
    hardPct: 0,
    createdAt: "2026-01-01T00:00:00Z",
  };

  it("maps a markdown question with its source as the participant body", () => {
    const battle: TopicBattle = {
      ...baseBattle,
      questions: [
        {
          id: "m1",
          title: "Explain in markdown",
          description: "",
          constraints: "",
          codeTemplate: "",
          language: "HTML",
          difficulty: "EASY",
          timeLimitMinutes: 10,
          points: 1,
          hintEnabled: true,
          hintText: "",
          testCases: [],
          kind: "markdown",
          mcqOptions: [],
          mcqCorrectId: "",
          tfAnswer: true,
          fillExpected: "",
          matchingAnswers: [],
          matchingPairs: [],
          orderingItems: [],
          markdown: { source: "## Photosynthesis\n\nExplain it.", rubric: "Clarity + accuracy" },
        },
      ],
    };

    const duel = buildDuelQuiz(battle);
    expect(duel.questions).toHaveLength(1);
    const question = duel.questions[0];
    expect(question.kind).toBe("markdown");
    if (question.kind !== "markdown") {
      throw new Error("expected markdown question");
    }
    expect(question.source).toBe("## Photosynthesis\n\nExplain it.");
    expect(question.rubric).toBe("Clarity + accuracy");
  });

  it("maps a design question with brief, deliverables, cover and canvas spec", () => {
    const battle: TopicBattle = {
      ...baseBattle,
      questions: [
        {
          id: "d1",
          title: "Design a poster",
          description: "",
          constraints: "",
          codeTemplate: "",
          language: "HTML",
          difficulty: "MEDIUM",
          timeLimitMinutes: 15,
          points: 2,
          hintEnabled: true,
          hintText: "",
          testCases: [],
          kind: "design",
          mcqOptions: [],
          mcqCorrectId: "",
          tfAnswer: true,
          fillExpected: "",
          matchingAnswers: [],
          matchingPairs: [],
          orderingItems: [],
          design: {
            brief: "<p>Design a recruiting poster.</p>",
            cover: { id: "c1", url: "https://cdn.example.com/poster.png", kind: "image" },
            canvasWidth: 1200,
            canvasHeight: 900,
            deliverables: ["Poster", "Palette"],
            rubric: "Layout + brand fit",
          },
        },
      ],
    };

    const duel = buildDuelQuiz(battle);
    expect(duel.questions).toHaveLength(1);
    const question = duel.questions[0];
    expect(question.kind).toBe("design");
    if (question.kind !== "design") {
      throw new Error("expected design question");
    }
    expect(question.brief).toBe("<p>Design a recruiting poster.</p>");
    expect(question.deliverables).toEqual(["Poster", "Palette"]);
    expect(question.coverUrl).toBe("https://cdn.example.com/poster.png");
    expect(question.canvasWidth).toBe(1200);
    expect(question.canvasHeight).toBe(900);
  });
});
/** ################################ /COMPONENT ############################# */
