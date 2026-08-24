/**
 * createBattle types
 * Shared types for the 8-step Create Topic Battle wizard.
 * The draft model mirrors deltalabs-desktop/src/modules/Competition/types/topicBattleDraft.ts
 * so the two surfaces stay aligned.
 */

import type { ReactNode } from "react";

/** One labelled step of the wizard (mirrors ProgressStepperStep). */
export interface CreateBattleWizardStep {
  id: string;
  label: string;
  icon: ReactNode;
}

// ============================================================================
// DRAFT MODEL
// ============================================================================

export interface TestCase {
  input: string;
  expectedOutput: string;
  explanation?: string;
  isSample?: boolean;
  isHidden?: boolean;
}

/**
 * Discriminator for the authoring surface of a custom question.
 * "coding" keeps the code-template / test-case canvas; the quiz types are
 * composed in the QuestionAuthoringEditor organism; "markdown" and "design"
 * open the Markdown Pad and Design Canvas workspace modules respectively.
 */
export type QuestionKind =
  | "coding"
  | "multiple_choice"
  | "true_false"
  | "fill_blank"
  | "matching"
  | "writing"
  | "ordering"
  | "markdown"
  | "design";

/**
 * A resolved media asset (image/video), typically produced by the upload-intent
 * pipeline and stored on a question for participant rendering.
 */
export interface MediaAsset {
  id: string;
  url: string;
  kind: "image" | "video";
}

/** Payload authored by the Markdown Pad workspace module (kind "markdown"). */
export interface MarkdownPadPayload {
  /** Raw markdown source — single source of truth authored in MarkdownEditor. */
  source: string;
  /** Human-grading rubric / scoring notes (plain markdown). */
  rubric: string;
}

/** Payload authored by the Design Canvas workspace module (kind "design"). */
export interface DesignCanvasPayload {
  /** Rich-HTML design brief authored with RichTextEditor. */
  brief: string;
  /** Cover / reference image resolved from the media upload pipeline. */
  cover: MediaAsset | null;
  /** Canvas dimensions in px the participant design should match. */
  canvasWidth: number;
  canvasHeight: number;
  /** Ordered list of design deliverables (poster, palette, …). */
  deliverables: string[];
  /** Human-grading rubric / scoring notes. */
  rubric: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  text: string;
}

export interface QuestionMatchingAnswer {
  id: string;
  text: string;
}

export interface QuestionMatchingPair {
  id: string;
  prompt: string;
  /** References a `QuestionMatchingAnswer` in `matchingAnswers` (Column B pool). */
  answerId: string;
}

export interface QuestionOrderItem {
  id: string;
  text: string;
}

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  /** LeetCode-style constraints section (rich HTML), rendered for participants. */
  constraints: string;
  codeTemplate: string;
  language: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TestCase[];
  // Quiz-type discriminator + type-specific payload (used when kind !== "coding").
  kind: QuestionKind;
  mcqOptions: QuestionOption[];
  mcqCorrectId: string;
  tfAnswer: boolean;
  /** Author-provided answer key for fill-in-the-blank (blank matching). */
  fillExpected: string;
  /** One answer per `[data-blank]` marker in the stem, in stem order. */
  fillAnswers: string[];
  /** Column B answer pool — pairs reference these by `answerId`. */
  matchingAnswers: QuestionMatchingAnswer[];
  matchingPairs: QuestionMatchingPair[];
  orderingItems: QuestionOrderItem[];
  /** Markdown Pad payload (used when kind === "markdown"). */
  markdown: MarkdownPadPayload;
  /** Design Canvas payload (used when kind === "design"). */
  design: DesignCanvasPayload;
}

let optionCounter = 0;
let pairCounter = 0;
let orderCounter = 0;

export function createEmptyOption(label: string): QuestionOption {
  optionCounter += 1;
  return { id: `opt_${Date.now()}_${optionCounter}`, label, text: "" };
}

export function createEmptyPair(): QuestionMatchingPair {
  pairCounter += 1;
  return { id: `pair_${Date.now()}_${pairCounter}`, prompt: "", answerId: "" };
}

export function createEmptyMatchingAnswer(): QuestionMatchingAnswer {
  pairCounter += 1;
  return { id: `ans_${Date.now()}_${pairCounter}`, text: "" };
}

export function createEmptyOrderItem(): QuestionOrderItem {
  orderCounter += 1;
  return { id: `order_${Date.now()}_${orderCounter}`, text: "" };
}

export function createEmptyQuestion(overrides?: Partial<CodingQuestion>): CodingQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: "",
    description: "",
    constraints: "",
    codeTemplate: "",
    language: "HTML",
    difficulty: "EASY",
    timeLimitMinutes: 10,
    points: 1.0,
    hintEnabled: true,
    hintText: "",
    testCases: [
      {
        input: "Sample Input 1",
        expectedOutput: "Expected Output 1",
        explanation: "",
        isSample: true,
        isHidden: false,
      },
      {
        input: "Hidden Edge Case 1",
        expectedOutput: "Hidden Output 1",
        explanation: "",
        isSample: false,
        isHidden: true,
      },
    ],
    kind: "coding",
    mcqOptions: ["A", "B", "C"].map((label) => createEmptyOption(label)),
    mcqCorrectId: "",
    tfAnswer: true,
    fillExpected: "",
    fillAnswers: [],
    matchingAnswers: [],
    matchingPairs: [createEmptyPair()],
    orderingItems: [createEmptyOrderItem()],
    markdown: {
      source: "",
      rubric: "",
    },
    design: {
      brief: "",
      cover: null,
      canvasWidth: 1080,
      canvasHeight: 1080,
      deliverables: [],
      rubric: "",
    },
    ...overrides,
  };
}

export type QuestionPoolMode = "auto" | "custom";

export interface TopicBattleDraft {
  topic: {
    id: string;
    name: string;
    category: string;
    difficulty: string;
  };
  format: {
    id: string;
  };
  visibility: {
    id: string;
    timing: "instant" | "schedule";
  };
  entrySetup: {
    slots: number;
    fee: number | "Free" | "Custom";
    customFee?: number;
  };
  prizeDistribution: {
    id: string;
    totalPool: number;
  };
  schedule: {
    date: string;
    time: string;
    timezone: string;
  };
  questionPool: {
    selectedCategories: string[];
    easyPct: number;
    mediumPct: number;
    hardPct: number;
    mode: QuestionPoolMode;
  };
  customQuestions: CodingQuestion[];
}

export const INITIAL_TOPIC_BATTLE_DRAFT: TopicBattleDraft = {
  topic: {
    id: "",
    name: "",
    category: "",
    difficulty: "",
  },
  format: {
    id: "mini",
  },
  visibility: {
    id: "public",
    timing: "instant",
  },
  entrySetup: {
    slots: 4,
    fee: "Free",
  },
  prizeDistribution: {
    id: "winner-takes-all",
    totalPool: 100,
  },
  schedule: {
    date: "",
    time: "",
    timezone: "UTC+3 (EAT)",
  },
  questionPool: {
    selectedCategories: [],
    easyPct: 40,
    mediumPct: 40,
    hardPct: 20,
    mode: "auto",
  },
  customQuestions: [],
};

// ============================================================================
// WIZARD STATE
// ============================================================================

/** Client-side wizard state (kept in CreateBattleWizardContext). */
export interface CreateBattleWizardState {
  currentStep: number;
  draft: TopicBattleDraft;
  searchQuery: string;
  /** Active topic-category filter pill ("All" = no filter). */
  filter: string;
  activeQuestionId: string;
}

export interface CreateBattleWizardContextValue extends CreateBattleWizardState {
  /** Visible wizard steps for the current start timing (Date & Time hidden for instant). */
  steps: CreateBattleWizardStep[];
  /** Number of visible steps. */
  totalSteps: number;
  goToStep: (step: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;

  selectTopic: (topicId: string, name: string, category: string, difficulty: string) => void;
  selectFormat: (formatId: string) => void;
  selectVisibility: (visibilityId: string, timing?: "instant" | "schedule") => void;
  updateEntrySetup: (slots: number, fee: number | "Free" | "Custom", customFee?: number) => void;
  updatePrizeDistribution: (distId: string, totalPool?: number) => void;
  updateSchedule: (date: string, time: string, timezone: string) => void;
  updateQuestionPoolMode: (mode: QuestionPoolMode) => void;
  updateQuestionPool: (categories: string[], easy: number, medium: number, hard: number) => void;

  addQuestion: () => void;
  updateQuestion: (id: string, updates: Partial<CodingQuestion>) => void;
  removeQuestion: (id: string) => void;
  setActiveQuestionId: (id: string) => void;

  submitBattle: () => Promise<{ ok: boolean; message?: string }>;

  setSearchQuery: (query: string) => void;
  setFilter: (filter: string) => void;
  reset: () => void;
}
