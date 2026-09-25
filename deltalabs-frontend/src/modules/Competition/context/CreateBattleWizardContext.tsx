/**
 * CreateBattleWizardContext
 * Context + useReducer state for the Create Topic Battle wizard.
 * Actions use UPPER_SNAKE_CASE; the draft mirrors the desktop reference
 * (deltalabs-desktop useCreateTopicBattle) with per-step `canGoNext`.
 */

"use client";

import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from "react";

import { createTopicBattle } from "@/modules/Competition/api";
import { getWizardStepId, getWizardSteps } from "@/modules/Competition/data/createBattleSteps";
import {
  INITIAL_TOPIC_BATTLE_DRAFT,
  createEmptyQuestion,
  type CreateBattleWizardContextValue,
  type CreateBattleWizardState,
  type TopicBattleDraft,
} from "@/modules/Competition/types/createBattle";

type CreateBattleWizardAction =
  | { type: "SET_CURRENT_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "RESET" }
  | { type: "UPDATE_DRAFT"; payload: Partial<TopicBattleDraft> }
  | {
      type: "SELECT_TOPIC";
      payload: { id: string; name: string; category: string; difficulty: string };
    }
  | { type: "SELECT_FORMAT"; payload: string }
  | { type: "SELECT_VISIBILITY"; payload: { id: string; timing: "instant" | "schedule" } }
  | {
      type: "UPDATE_ENTRY_SETUP";
      payload: { slots: number; fee: number | "Free" | "Custom"; customFee?: number };
    }
  | { type: "UPDATE_PRIZE_DISTRIBUTION"; payload: { id: string; totalPool?: number } }
  | { type: "UPDATE_SCHEDULE"; payload: { date: string; time: string; timezone: string } }
  | {
      type: "UPDATE_QUESTION_POOL";
      payload: { categories: string[]; easy: number; medium: number; hard: number };
    }
  | { type: "UPDATE_QUESTION_POOL_MODE"; payload: "auto" | "custom" }
  | { type: "ADD_QUESTION" }
  | {
      type: "UPDATE_QUESTION";
      payload: { id: string; updates: Partial<ReturnType<typeof createEmptyQuestion>> };
    }
  | { type: "REMOVE_QUESTION"; payload: string }
  | { type: "SET_ACTIVE_QUESTION_ID"; payload: string }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FILTER"; payload: string };

const INITIAL_STATE: CreateBattleWizardState = {
  currentStep: 1,
  draft: INITIAL_TOPIC_BATTLE_DRAFT,
  searchQuery: "",
  filter: "All",
  activeQuestionId: "",
};

function clampStep(step: number, total: number): number {
  return Math.min(total, Math.max(1, step));
}

function createBattleWizardReducer(
  state: CreateBattleWizardState,
  action: CreateBattleWizardAction,
): CreateBattleWizardState {
  const visibleTotal = getWizardSteps(state.draft.visibility.timing).length;
  switch (action.type) {
    case "SET_CURRENT_STEP":
      return { ...state, currentStep: clampStep(action.payload, visibleTotal) };
    case "NEXT_STEP":
      return { ...state, currentStep: clampStep(state.currentStep + 1, visibleTotal) };
    case "PREVIOUS_STEP":
      return { ...state, currentStep: clampStep(state.currentStep - 1, visibleTotal) };
    case "UPDATE_DRAFT":
      return { ...state, draft: { ...state.draft, ...action.payload } };
    case "SELECT_TOPIC":
      return {
        ...state,
        draft: {
          ...state.draft,
          topic: {
            id: action.payload.id,
            name: action.payload.name,
            category: action.payload.category,
            difficulty: action.payload.difficulty,
          },
        },
      };
    case "SELECT_FORMAT":
      return { ...state, draft: { ...state.draft, format: { id: action.payload } } };
    case "SELECT_VISIBILITY":
      return {
        ...state,
        currentStep: clampStep(state.currentStep, getWizardSteps(action.payload.timing).length),
        draft: {
          ...state.draft,
          visibility: { id: action.payload.id, timing: action.payload.timing },
        },
      };
    case "UPDATE_ENTRY_SETUP":
      return {
        ...state,
        draft: {
          ...state.draft,
          entrySetup: {
            slots: action.payload.slots,
            fee: action.payload.fee,
            customFee: action.payload.customFee,
          },
        },
      };
    case "UPDATE_PRIZE_DISTRIBUTION":
      return {
        ...state,
        draft: {
          ...state.draft,
          prizeDistribution: {
            id: action.payload.id,
            totalPool: action.payload.totalPool ?? state.draft.prizeDistribution.totalPool,
          },
        },
      };
    case "UPDATE_SCHEDULE":
      return {
        ...state,
        draft: {
          ...state.draft,
          schedule: {
            date: action.payload.date,
            time: action.payload.time,
            timezone: action.payload.timezone,
          },
        },
      };
    case "UPDATE_QUESTION_POOL":
      return {
        ...state,
        draft: {
          ...state.draft,
          questionPool: {
            ...state.draft.questionPool,
            selectedCategories: action.payload.categories,
            easyPct: action.payload.easy,
            mediumPct: action.payload.medium,
            hardPct: action.payload.hard,
          },
        },
      };
    case "UPDATE_QUESTION_POOL_MODE":
      return {
        ...state,
        draft: {
          ...state.draft,
          questionPool: { ...state.draft.questionPool, mode: action.payload },
        },
      };
    case "ADD_QUESTION": {
      const question = createEmptyQuestion();
      return {
        ...state,
        draft: { ...state.draft, customQuestions: [...state.draft.customQuestions, question] },
        activeQuestionId: question.id,
      };
    }
    case "UPDATE_QUESTION":
      return {
        ...state,
        draft: {
          ...state.draft,
          customQuestions: state.draft.customQuestions.map((q) =>
            q.id === action.payload.id ? { ...q, ...action.payload.updates } : q,
          ),
        },
      };
    case "REMOVE_QUESTION": {
      const filtered = state.draft.customQuestions.filter((q) => q.id !== action.payload);
      const nextActive = filtered.length > 0 ? filtered[filtered.length - 1].id : "";
      return {
        ...state,
        draft: { ...state.draft, customQuestions: filtered },
        activeQuestionId: nextActive,
      };
    }
    case "SET_ACTIVE_QUESTION_ID":
      return { ...state, activeQuestionId: action.payload };
    case "SET_SEARCH_QUERY":
      return { ...state, searchQuery: action.payload };
    case "SET_FILTER":
      return { ...state, filter: action.payload };
    case "RESET":
      return { ...INITIAL_STATE };
    default:
      return state;
  }
}

const CreateBattleWizardContext = createContext<CreateBattleWizardContextValue | undefined>(
  undefined,
);

export interface CreateBattleWizardProviderProps {
  children: ReactNode;
  /**
   * Real owner display name stamped on `createTopicBattle` (defaults to "You"
   * so guest creation still works).
   */
  creatorName?: string;
}

export function CreateBattleWizardProvider({
  children,
  creatorName = "You",
}: Readonly<CreateBattleWizardProviderProps>) {
  const [state, dispatch] = useReducer(createBattleWizardReducer, INITIAL_STATE);

  const canGoNext = useMemo(() => {
    const { draft } = state;
    const stepId = getWizardStepId(state.currentStep, draft.visibility.timing);
    switch (stepId) {
      case "topic-selection":
        return Boolean(draft.topic.id && draft.topic.name && draft.topic.category);
      case "battle-format":
        return Boolean(draft.format.id);
      case "match-type":
        if (!draft.visibility.id) return false;
        if (draft.visibility.timing === "schedule") {
          return Boolean(draft.schedule.date && draft.schedule.time);
        }
        return true;
      case "player-setup":
        if (!draft.entrySetup.slots || draft.entrySetup.slots < 2) return false;
        if (draft.entrySetup.fee === "Custom") {
          return Boolean(draft.entrySetup.customFee && draft.entrySetup.customFee > 0);
        }
        return Boolean(draft.entrySetup.fee);
      case "prize-rules":
        return Boolean(draft.prizeDistribution.id && draft.prizeDistribution.totalPool > 0);
      case "date-time":
        return Boolean(draft.schedule.date && draft.schedule.time);
      case "questions":
        if (draft.questionPool.mode === "auto") return true;
        return (
          draft.customQuestions.length > 0 &&
          draft.customQuestions.every((q) => q.title.trim().length > 0)
        );
      default:
        return true;
    }
  }, [state]);

  const visibleSteps = useMemo(
    () => getWizardSteps(state.draft.visibility.timing),
    [state.draft.visibility.timing],
  );

  const goToStep = useCallback((step: number) => {
    dispatch({ type: "SET_CURRENT_STEP", payload: step });
  }, []);

  const goNext = useCallback(() => {
    dispatch({ type: "NEXT_STEP" });
  }, []);

  const goPrevious = useCallback(() => {
    dispatch({ type: "PREVIOUS_STEP" });
  }, []);

  const selectTopic = useCallback(
    (id: string, name: string, category: string, difficulty: string = "") => {
      dispatch({ type: "SELECT_TOPIC", payload: { id, name, category, difficulty } });
    },
    [],
  );

  const selectFormat = useCallback((formatId: string) => {
    dispatch({ type: "SELECT_FORMAT", payload: formatId });
  }, []);

  const selectVisibility = useCallback(
    (visibilityId: string, timing: "instant" | "schedule" = "instant") => {
      dispatch({ type: "SELECT_VISIBILITY", payload: { id: visibilityId, timing } });
    },
    [],
  );

  const updateEntrySetup = useCallback(
    (slots: number, fee: number | "Free" | "Custom", customFee?: number) => {
      dispatch({ type: "UPDATE_ENTRY_SETUP", payload: { slots, fee, customFee } });
    },
    [],
  );

  const updatePrizeDistribution = useCallback((distId: string, totalPool?: number) => {
    dispatch({ type: "UPDATE_PRIZE_DISTRIBUTION", payload: { id: distId, totalPool } });
  }, []);

  const updateSchedule = useCallback((date: string, time: string, timezone: string) => {
    dispatch({ type: "UPDATE_SCHEDULE", payload: { date, time, timezone } });
  }, []);

  const updateQuestionPool = useCallback(
    (categories: string[], easy: number, medium: number, hard: number) => {
      dispatch({ type: "UPDATE_QUESTION_POOL", payload: { categories, easy, medium, hard } });
    },
    [],
  );

  const updateQuestionPoolMode = useCallback((mode: "auto" | "custom") => {
    dispatch({ type: "UPDATE_QUESTION_POOL_MODE", payload: mode });
  }, []);

  const addQuestion = useCallback(() => {
    dispatch({ type: "ADD_QUESTION" });
  }, []);

  const updateQuestion = useCallback(
    (id: string, updates: Partial<ReturnType<typeof createEmptyQuestion>>) => {
      dispatch({ type: "UPDATE_QUESTION", payload: { id, updates } });
    },
    [],
  );

  const removeQuestion = useCallback((id: string) => {
    dispatch({ type: "REMOVE_QUESTION", payload: id });
  }, []);

  const setActiveQuestionId = useCallback((id: string) => {
    dispatch({ type: "SET_ACTIVE_QUESTION_ID", payload: id });
  }, []);

  const setSearchQuery = useCallback((query: string) => {
    dispatch({ type: "SET_SEARCH_QUERY", payload: query });
  }, []);

  const setFilter = useCallback((filter: string) => {
    dispatch({ type: "SET_FILTER", payload: filter });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const submitBattle = useCallback(async (): Promise<{ ok: boolean; message?: string }> => {
    const { draft } = state;
    const entryFee =
      draft.entrySetup.fee === "Free"
        ? "Free"
        : draft.entrySetup.customFee
          ? `${draft.entrySetup.customFee} ETB`
          : `${draft.entrySetup.fee} ETB`;
    const prizePool = `${draft.prizeDistribution.totalPool} ETB`;

    const questions =
      draft.questionPool.mode === "custom"
        ? draft.customQuestions.map((q) => ({
            id: q.id,
            title: q.title,
            description: q.description,
            constraints: q.constraints,
            codeTemplate: q.codeTemplate,
            language: q.language,
            difficulty: q.difficulty,
            timeLimitMinutes: q.timeLimitMinutes,
            points: q.points,
            hintEnabled: q.hintEnabled,
            hintText: q.hintText,
            testCases: q.testCases,
            kind: q.kind,
            mcqOptions: q.mcqOptions,
            mcqCorrectId: q.mcqCorrectId,
            tfAnswer: q.tfAnswer,
            fillExpected: q.fillExpected,
            fillAnswers: q.fillAnswers,
            matchingAnswers: q.matchingAnswers,
            matchingPairs: q.matchingPairs,
            orderingItems: q.orderingItems,
            markdown: q.markdown,
            design: q.design,
          }))
        : [];

    const formatMinutes: Record<string, number> = {
      "1v1": 5,
      mini: 10,
      t8: 15,
      t16: 30,
      t32: 60,
    };
    const battleDifficulty =
      draft.topic.difficulty || (draft.questionPool.mode === "auto" ? "Mixed" : "Custom");

    try {
      await createTopicBattle({
        title: draft.topic.name,
        subject: draft.topic.category,
        difficulty: battleDifficulty,
        entryFee,
        prizePool,
        playersMax: draft.entrySetup.slots,
        creatorName,
        scheduleDate: draft.schedule.date || undefined,
        scheduleTime: draft.schedule.time || undefined,
        scheduleTimezone: draft.schedule.timezone || undefined,
        format: draft.format.id,
        durationMinutes: formatMinutes[draft.format.id] ?? 10,
        visibility: draft.visibility.id,
        timing: draft.visibility.timing,
        prizeRule: draft.prizeDistribution.id,
        questionPoolMode: draft.questionPool.mode,
        easyPct: draft.questionPool.easyPct,
        mediumPct: draft.questionPool.mediumPct,
        hardPct: draft.questionPool.hardPct,
        questions,
      });
      return { ok: true };
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to create battle. Please try again.";
      return { ok: false, message };
    }
  }, [state, creatorName]);

  const value: CreateBattleWizardContextValue = {
    ...state,
    steps: visibleSteps,
    totalSteps: visibleSteps.length,
    canGoNext,
    isFirstStep: state.currentStep <= 1,
    isLastStep: state.currentStep >= visibleSteps.length,
    goToStep,
    goNext,
    goPrevious,
    selectTopic,
    selectFormat,
    selectVisibility,
    updateEntrySetup,
    updatePrizeDistribution,
    updateSchedule,
    updateQuestionPool,
    updateQuestionPoolMode,
    addQuestion,
    updateQuestion,
    removeQuestion,
    setActiveQuestionId,
    submitBattle,
    setSearchQuery,
    setFilter,
    reset,
  };

  return (
    <CreateBattleWizardContext.Provider value={value}>
      {children}
    </CreateBattleWizardContext.Provider>
  );
}

export function useCreateBattleWizard(): CreateBattleWizardContextValue {
  const context = useContext(CreateBattleWizardContext);
  if (context === undefined) {
    throw new Error("useCreateBattleWizard must be used within a CreateBattleWizardProvider");
  }
  return context;
}

export default CreateBattleWizardContext;
