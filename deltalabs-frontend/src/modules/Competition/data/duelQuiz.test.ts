/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import {
  buildDuelQuiz,
  mergeLiveLeaderboard,
  toDuelQuestion,
  toDuelLeaderboardEntries,
} from "@/modules/Competition/data/duelQuiz";
import type {
  TopicBattle,
  TopicBattleLeaderboard,
  TopicBattleQuestion,
} from "@/modules/Competition/types/topicBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";

/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */

/**
 * A participant-facing question exactly as the backend redacted projection
 * arrives: no `mcqCorrectId`, `tfAnswer`, `fillExpected`, `testCases`, or
 * matching pairings. Tests build on this rather than on an authored question so
 * a re-introduced key field fails loudly instead of being silently assumed.
 */
function publicQuestion(overrides: Partial<TopicBattleQuestion> = {}): TopicBattleQuestion {
  return {
    id: "q1",
    title: "Question",
    description: "",
    constraints: "",
    codeTemplate: "",
    language: "HTML",
    difficulty: "EASY",
    timeLimitMinutes: 10,
    points: 1,
    hintEnabled: true,
    hintText: "",
    kind: "multiple_choice",
    mcqOptions: [],
    orderingItems: [],
    ...overrides,
  };
}

function battle(questions: TopicBattleQuestion[]): TopicBattle {
  return {
    id: "b1",
    title: "Battle",
    subject: "Programming",
    difficulty: "Mixed",
    status: "open",
    countdownEndsAt: null,
    creator: { name: "Host" },
    ownerUserId: null,
    isOwner: false,
    hasJoined: true,
    hasCompleted: false,
    prizePool: "0 ETB",
    entryFee: "Free",
    playersJoined: 3,
    playersMax: 8,
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
    questions,
  };
}

/** ################################ /HELPERS ############################ */

/** ################################ TESTS ############################# */

describe("toDuelQuiz — keyless projections", () => {
  it("drops the MCQ correct option id", () => {
    const mapped = toDuelQuestion(
      publicQuestion({
        kind: "multiple_choice",
        mcqOptions: [
          { id: "a", label: "A", text: "A" },
          { id: "b", label: "B", text: "B" },
        ],
      }),
    );

    expect(mapped).not.toBeNull();
    expect(mapped).not.toHaveProperty("correctId");
    expect((mapped as { options: unknown[] }).options).toHaveLength(2);
  });

  it("drops the true/false key", () => {
    const mapped = toDuelQuestion(publicQuestion({ kind: "true_false" }));

    expect(mapped).not.toBeNull();
    expect(mapped).not.toHaveProperty("correct");
  });

  it("keeps the blank count the server reports", () => {
    const mapped = toDuelQuestion(
      publicQuestion({
        kind: "fill_blank",
        description: "The capital of Ethiopia is [data-blank].",
        blankCount: 1,
      }),
    );

    expect(mapped).toMatchObject({ kind: "fill_blank", blankCount: 1 });
    expect(mapped).not.toHaveProperty("expected");
    expect(mapped).not.toHaveProperty("answers");
  });

  it("sends both matching columns but strips the pairing", () => {
    const mapped = toDuelQuestion(
      publicQuestion({
        kind: "matching",
        matchingAnswers: [
          { id: "ans_1", text: "Mercury" },
          { id: "ans_2", text: "Venus" },
        ],
        matchingPrompts: [
          { id: "p1", prompt: "Closest planet to the Sun" },
          { id: "p2", prompt: "Hottest planet" },
        ],
      }),
    );

    expect(mapped).toMatchObject({ kind: "matching" });
    const question = mapped as { answers: unknown[]; pairs: Array<Record<string, unknown>> };
    expect(question.answers).toHaveLength(2);
    expect(question.pairs.map((p) => p.id)).toEqual(["p1", "p2"]);
    for (const pair of question.pairs) {
      expect(pair).not.toHaveProperty("answerId");
    }
  });

  it("uses sample inputs for coding and keeps no expected output", () => {
    const mapped = toDuelQuestion(
      publicQuestion({
        kind: "coding",
        description: "Find the pair that sums to the target.",
        codeTemplate: "function twoSum() {}",
        language: "JavaScript",
        sampleInputs: ["[2,7,11,15], 9"],
      }),
    );

    const question = mapped as { testCases: Array<{ input: string; expectedOutput: string }> };
    expect(question.testCases).toEqual([{ input: "[2,7,11,15], 9", expectedOutput: "" }]);
  });

  it("never carries a markdown or design rubric to the participant", () => {
    const markdown = toDuelQuestion(
      publicQuestion({
        kind: "markdown",
        title: "Write a README",
        markdown: { source: "# Title" },
      }),
    );
    const design = toDuelQuestion(
      publicQuestion({
        kind: "design",
        title: "Design a poster",
        design: {
          brief: "Poster for a launch",
          cover: null,
          deliverables: [],
          canvasWidth: 1080,
          canvasHeight: 1080,
        },
      }),
    );

    expect(markdown).not.toBeNull();
    expect(markdown).not.toHaveProperty("rubric");
    expect(design).not.toBeNull();
    expect(design).not.toHaveProperty("rubric");
  });
});

describe("toDuelQuiz — Live Duel authoring payload", () => {
  /**
   * `CodingQuestion` is the host authoring surface and still carries the key.
   * `toDuelQuestion` is the boundary that has to strip it, because the Live
   * Duel runner grades on the server the same way the topic battle does.
   */
  function authored(overrides: Partial<CodingQuestion> = {}): CodingQuestion {
    return {
      id: "c1",
      title: "Match the pairs",
      description: "",
      constraints: "",
      codeTemplate: "",
      language: "HTML",
      difficulty: "EASY",
      timeLimitMinutes: 10,
      points: 1,
      hintEnabled: true,
      hintText: "",
      kind: "matching",
      testCases: [],
      mcqOptions: [],
      mcqCorrectId: "",
      tfAnswer: true,
      fillExpected: "",
      fillAnswers: [],
      matchingAnswers: [{ id: "ans_1", text: "Mercury" }],
      matchingPairs: [{ id: "p1", prompt: "Closest to the Sun", answerId: "ans_1" }],
      orderingItems: [],
      markdown: { source: "", rubric: "" },
      design: {
        brief: "",
        cover: null,
        deliverables: [],
        canvasWidth: 1080,
        canvasHeight: 1080,
        rubric: "",
      },
      ...overrides,
    };
  }

  it("strips answerId from an authored pair", () => {
    const mapped = toDuelQuestion(authored()) as { pairs: Array<Record<string, unknown>> };

    expect(mapped.pairs).toEqual([{ id: "p1", prompt: "Closest to the Sun" }]);
  });

  it("strips an authored MCQ correct id", () => {
    const mapped = toDuelQuestion(
      authored({
        kind: "multiple_choice",
        mcqOptions: [
          { id: "a", label: "A", text: "A" },
          { id: "b", label: "B", text: "B" },
        ],
        mcqCorrectId: "b",
      }),
    );

    expect(mapped).not.toBeNull();
    expect(mapped).not.toHaveProperty("correctId");
  });

  it("derives sample inputs from authored test cases", () => {
    const coding = toDuelQuestion(
      authored({
        kind: "coding",
        testCases: [
          { input: "1 2", expectedOutput: "3", explanation: "", isSample: true, isHidden: false },
          { input: "9 9", expectedOutput: "18", explanation: "", isSample: false, isHidden: true },
        ],
      }),
    ) as { testCases: Array<{ input: string; expectedOutput: string }> };

    expect(coding.testCases).toEqual([{ input: "1 2", expectedOutput: "" }]);
  });

  it("derives the blank count from authored answers, then the stem", () => {
    const fromAnswers = toDuelQuestion(
      authored({ kind: "fill_blank", fillAnswers: ["a", "b", "c"] }),
    ) as { blankCount: number };
    const fromStem = toDuelQuestion(
      authored({
        kind: "fill_blank",
        fillAnswers: [],
        description: "Water freezes at [data-blank] and boils at [data-blank].",
      }),
    ) as { blankCount: number };

    expect(fromAnswers.blankCount).toBe(3);
    expect(fromStem.blankCount).toBe(2);
  });

  it("never carries an authored rubric", () => {
    const markdown = toDuelQuestion(
      authored({
        kind: "markdown",
        markdown: { source: "# Title", rubric: "Mentions setup" },
      }),
    );

    expect(markdown).not.toHaveProperty("rubric");
  });
});

describe("buildDuelQuiz", () => {
  it("keeps only authored questions and invents none", () => {
    const quiz = buildDuelQuiz(battle([]));

    expect(quiz.questions).toEqual([]);
  });

  it("skips questions that cannot be presented, rather than guessing at them", () => {
    const quiz = buildDuelQuiz(
      battle([
        publicQuestion({
          id: "usable",
          kind: "multiple_choice",
          mcqOptions: [
            { id: "a", label: "A", text: "A" },
            { id: "b", label: "B", text: "B" },
          ],
        }),
        // Fewer than two options is unanswerable, so it is dropped. A fallback
        // deck here would be graded by a server that has never seen it.
        publicQuestion({ id: "unusable", kind: "multiple_choice", mcqOptions: [] }),
      ]),
    );

    expect(quiz.questions.map((q) => q.id)).toEqual(["usable"]);
  });

  it("reports the real joined count and only the participant's own row", () => {
    const quiz = buildDuelQuiz(battle([publicQuestion()]));

    expect(quiz.playerCount).toBe(3);
    expect(quiz.leaderboard).toEqual([{ rank: 1, name: "You", points: 0, isCurrentUser: true }]);
  });

  it("carries the battle identity and title through", () => {
    const quiz = buildDuelQuiz(battle([publicQuestion()]));

    expect(quiz.battleId).toBe("b1");
    expect(quiz.battleTitle).toBe("Battle");
  });

  it("uses the real server standings when they are present", () => {
    const entries = [
      { rank: 1, name: "Ada", points: 120, isCurrentUser: true, userId: "u1" },
      { rank: 2, name: "Linus", points: 80, isCurrentUser: false, userId: "u2" },
    ];
    const quiz = buildDuelQuiz(battle([publicQuestion()]), entries);

    expect(quiz.leaderboard).toEqual(entries);
  });

  it("falls back to the participant's own row when no standings exist yet", () => {
    const quiz = buildDuelQuiz(battle([publicQuestion()]), []);

    expect(quiz.leaderboard).toEqual([{ rank: 1, name: "You", points: 0, isCurrentUser: true }]);
  });
});

describe("toDuelLeaderboardEntries — real server standings", () => {
  function serverBoard(overrides: Partial<TopicBattleLeaderboard> = {}): TopicBattleLeaderboard {
    return {
      battleId: "b1",
      totalCompleted: 2,
      entries: [
        {
          rank: 1,
          userId: "u1",
          name: "Ada Lovelace",
          avatarUrl: "https://example.com/a.png",
          points: 120,
          isOwner: true,
        },
        { rank: 2, userId: "u2", name: "Linus", avatarUrl: null, points: 80, isOwner: false },
      ],
      ...overrides,
    };
  }

  it("maps rows exactly as ranked by the server", () => {
    const entries = toDuelLeaderboardEntries(serverBoard(), null);

    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ rank: 1, name: "Ada Lovelace", points: 120, userId: "u1" });
    expect(entries[1]).toMatchObject({ rank: 2, name: "Linus", points: 80, userId: "u2" });
  });

  it("labels the current user's row as You and marks it", () => {
    const entries = toDuelLeaderboardEntries(serverBoard(), "u1");

    expect(entries[0]).toMatchObject({ rank: 1, name: "You", points: 120, isCurrentUser: true });
    expect(entries[1]).toMatchObject({ isCurrentUser: false });
  });

  it("returns an empty list when the board is not fetched yet", () => {
    expect(toDuelLeaderboardEntries(undefined, "u1")).toEqual([]);
  });
});

describe("mergeLiveLeaderboard — overlay the live server score", () => {
  it("keeps server rows and replaces the participant's points in place", () => {
    const entries = [
      { rank: 1, name: "Ada", points: 120, isCurrentUser: false, userId: "u1" },
      { rank: 2, name: "You", points: 40, isCurrentUser: true, userId: "u2" },
      { rank: 3, name: "Linus", points: 20, isCurrentUser: false, userId: "u3" },
    ];

    const merged = mergeLiveLeaderboard(entries, 90);

    expect(merged).toHaveLength(3);
    expect(merged.find((e) => e.userId === "u1")).toMatchObject({ rank: 1, points: 120 });
    expect(merged.find((e) => e.userId === "u2")).toMatchObject({ rank: 2, points: 90 });
    expect(merged.find((e) => e.userId === "u3")).toMatchObject({ rank: 3, points: 20 });
  });

  it("appends the participant as their own row before they finish", () => {
    const entries = [
      { rank: 1, name: "Ada", points: 120, isCurrentUser: false, userId: "u1" },
      { rank: 2, name: "Linus", points: 80, isCurrentUser: false, userId: "u2" },
    ];

    const merged = mergeLiveLeaderboard(entries, 60);

    expect(merged).toHaveLength(3);
    expect(merged.find((e) => e.isCurrentUser)).toMatchObject({
      name: "You",
      points: 60,
      rank: 3,
    });
  });

  it("re-ranks with the server's dense ranking when points tie", () => {
    const entries = [
      { rank: 1, name: "Ada", points: 100, isCurrentUser: false, userId: "u1" },
      { rank: 2, name: "You", points: 0, isCurrentUser: true, userId: "u2" },
    ];

    const merged = mergeLiveLeaderboard(entries, 100);

    const ranks = merged.map((e) => e.rank);
    expect(ranks).toEqual([1, 1]);
    expect(merged.find((e) => e.isCurrentUser)?.rank).toBe(1);
  });

  it("keeps server rows even when the participant is not ranked yet", () => {
    const entries = [{ rank: 1, name: "Ada", points: 100, isCurrentUser: false, userId: "u1" }];

    const merged = mergeLiveLeaderboard(entries, 10);

    expect(merged.map((e) => e.name)).toEqual(["Ada", "You"]);
    expect(merged[0].points).toBe(100);
  });
});
