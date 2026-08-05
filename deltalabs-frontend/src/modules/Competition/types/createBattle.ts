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

export interface CodingQuestion {
  id: string;
  title: string;
  description: string;
  codeTemplate: string;
  language: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TestCase[];
}

export function createEmptyQuestion(overrides?: Partial<CodingQuestion>): CodingQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: "",
    description: "",
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
    ...overrides,
  };
}

export type QuestionPoolMode = "auto" | "custom";

export interface TopicBattleDraft {
  topic: {
    id: string;
    name: string;
    category: string;
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
    timezone: "(GMT+03:00) East Africa Time",
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
  goToStep: (step: number) => void;
  goNext: () => void;
  goPrevious: () => void;
  canGoNext: boolean;
  isFirstStep: boolean;
  isLastStep: boolean;

  selectTopic: (topicId: string, name: string, category: string) => void;
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
