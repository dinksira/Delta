/**
 * Topic Battle Draft
 * Types for the Create Topic Battle Wizard.
 */

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
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  timeLimitMinutes: number;
  points: number;
  hintEnabled: boolean;
  hintText: string;
  testCases: TestCase[];
}

export function createEmptyQuestion(overrides?: Partial<CodingQuestion>): CodingQuestion {
  return {
    id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    title: '',
    description: '',
    codeTemplate: '',
    language: 'HTML',
    difficulty: 'EASY',
    timeLimitMinutes: 10,
    points: 1.0,
    hintEnabled: true,
    hintText: '',
    testCases: [
      {
        input: 'Sample Input 1',
        expectedOutput: 'Expected Output 1',
        explanation: '',
        isSample: true,
        isHidden: false,
      },
      {
        input: 'Hidden Edge Case 1',
        expectedOutput: 'Hidden Output 1',
        explanation: '',
        isSample: false,
        isHidden: true,
      },
    ],
    ...overrides,
  };
}

export type QuestionPoolMode = 'auto' | 'custom';

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
    timing: 'instant' | 'schedule';
  };
  entrySetup: {
    slots: number;
    fee: number | 'Free' | 'Custom';
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
    id: '',
    name: '',
    category: '',
  },
  format: {
    id: '1v1',
  },
  visibility: {
    id: 'public',
    timing: 'instant',
  },
  entrySetup: {
    slots: 2,
    fee: 'Free',
  },
  prizeDistribution: {
    id: 'winner-takes-all',
    totalPool: 100,
  },
  schedule: {
    date: '',
    time: '',
    timezone: '(GMT+03:00) East Africa Time',
  },
  questionPool: {
    selectedCategories: [],
    easyPct: 40,
    mediumPct: 40,
    hardPct: 20,
    mode: 'auto',
  },
  customQuestions: [],
};
