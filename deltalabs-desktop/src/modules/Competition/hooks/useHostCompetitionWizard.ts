/**
 * useHostCompetitionWizard
 * Manages multi-step wizard state: current step, draft data, validation, navigation.
 */

import { useState, useCallback, useMemo } from "react";

import type {
  HostCompetitionDraft,
  StepValidation,
  PrizeEntry,
  PhaseEntry,
  CompetitionModuleType,
  CodeEditorQuestion,
  CodeEditorModuleState,
  CodeEditorLanguage,
  CodeEditorDifficulty,
} from "@/modules/Competition/types/host";

// ============================================================================
// CONSTANTS
// ============================================================================

const STEP_LABELS = ["Overview", "Prize Details", "Timeline", "Terms & Conditions", "Workspace"];

// ============================================================================
// HELPERS
// ============================================================================

function createEmptyDraft(): HostCompetitionDraft {
  return {
    overview: {
      coverImage: null,
      coverImagePreview: "",
      title: "",
      description: "",
    },
    prizes: [
      {
        id: "prize-1",
        rank: "",
        type: "money",
        valueDescription: "",
        winCondition: "",
      },
    ],
    timeline: [
      {
        id: "phase-1",
        phaseName: "",
        description: "",
        startDate: "",
        endDate: "",
      },
    ],
    terms: {
      richTextContent: "",
      agreed: false,
    },
    workspace: {
      selectedModule: null,
      moduleConfig: {},
    },
    status: "draft",
  };
}

let prizeCounter = 1;
let phaseCounter = 1;
let questionCounter = 1;

const LANGUAGE_DEFAULT: CodeEditorLanguage = "html";

function createDefaultCodeEditorState(): CodeEditorModuleState {
  const id = `q-${questionCounter}`;
  return {
    questions: [
      {
        id,
        number: "Q1",
        problemDescription: "",
        codeDescription: "",
        settings: {
          language: LANGUAGE_DEFAULT,
          difficulty: "easy",
          timerMinutes: 0,
          points: 0,
          hintEnabled: false,
          hintText: "",
        },
      },
    ],
    activeQuestionId: id,
  };
}

// ============================================================================
// HOOK
// ============================================================================

export function useHostCompetitionWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [draft, setDraft] = useState<HostCompetitionDraft>(createEmptyDraft);

  // -------- Overview --------
  const setCoverImage = useCallback((file: File | null, preview: string) => {
    setDraft((prev) => ({
      ...prev,
      overview: { ...prev.overview, coverImage: file, coverImagePreview: preview },
    }));
  }, []);

  const setOverviewTitle = useCallback((title: string) => {
    setDraft((prev) => ({
      ...prev,
      overview: { ...prev.overview, title },
    }));
  }, []);

  const setOverviewDescription = useCallback((description: string) => {
    setDraft((prev) => ({
      ...prev,
      overview: { ...prev.overview, description },
    }));
  }, []);

  // -------- Prizes --------
  const addPrize = useCallback(() => {
    prizeCounter++;
    setDraft((prev) => ({
      ...prev,
      prizes: [
        ...prev.prizes,
        {
          id: `prize-${prizeCounter}`,
          rank: "",
          type: "money" as const,
          valueDescription: "",
          winCondition: "",
        },
      ],
    }));
  }, []);

  const removePrize = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      prizes: prev.prizes.filter((p) => p.id !== id),
    }));
  }, []);

  const updatePrize = useCallback(
    (id: string, patch: Partial<PrizeEntry>) => {
      setDraft((prev) => ({
        ...prev,
        prizes: prev.prizes.map((p) => (p.id === id ? { ...p, ...patch } : p)),
      }));
    },
    [],
  );

  // -------- Timeline --------
  const addPhase = useCallback(() => {
    phaseCounter++;
    setDraft((prev) => ({
      ...prev,
      timeline: [
        ...prev.timeline,
        {
          id: `phase-${phaseCounter}`,
          phaseName: "",
          description: "",
          startDate: "",
          endDate: "",
        },
      ],
    }));
  }, []);

  const removePhase = useCallback((id: string) => {
    setDraft((prev) => ({
      ...prev,
      timeline: prev.timeline.filter((p) => p.id !== id),
    }));
  }, []);

  const updatePhase = useCallback(
    (id: string, patch: Partial<PhaseEntry>) => {
      setDraft((prev) => ({
        ...prev,
        timeline: prev.timeline.map((p) =>
          p.id === id ? { ...p, ...patch } : p,
        ),
      }));
    },
    [],
  );

  // -------- Terms --------
  const setTermsContent = useCallback((content: string) => {
    setDraft((prev) => ({
      ...prev,
      terms: { ...prev.terms, richTextContent: content },
    }));
  }, []);

  const setTermsAgreed = useCallback((agreed: boolean) => {
    setDraft((prev) => ({
      ...prev,
      terms: { ...prev.terms, agreed },
    }));
  }, []);

  // -------- Workspace --------
  const setSelectedModule = useCallback((module: CompetitionModuleType | null) => {
    setDraft((prev) => {
      const next = { ...prev, workspace: { ...prev.workspace, selectedModule: module } };
      if (module === "code-editor" && !next.workspace.moduleConfig["code-editor"]) {
        next.workspace.moduleConfig["code-editor"] = createDefaultCodeEditorState();
      }
      return next;
    });
  }, []);

  // -------- Code Editor Module --------

  const codeEditorState = draft.workspace.moduleConfig["code-editor"] as
    | CodeEditorModuleState
    | undefined;

  const setCodeEditorState = useCallback(
    (patch: Partial<CodeEditorModuleState>) => {
      setDraft((prev) => {
        const current = prev.workspace.moduleConfig["code-editor"] as
          | CodeEditorModuleState
          | undefined;
        if (!current) return prev;
        return {
          ...prev,
          workspace: {
            ...prev.workspace,
            moduleConfig: {
              ...prev.workspace.moduleConfig,
              "code-editor": { ...current, ...patch },
            },
          },
        };
      });
    },
    [],
  );

  const updateActiveQuestion = useCallback(
    (patch: Partial<CodeEditorQuestion>) => {
      setDraft((prev) => {
        const state = prev.workspace.moduleConfig["code-editor"] as
          | CodeEditorModuleState
          | undefined;
        if (!state) return prev;
        return {
          ...prev,
          workspace: {
            ...prev.workspace,
            moduleConfig: {
              ...prev.workspace.moduleConfig,
              "code-editor": {
                ...state,
                questions: state.questions.map((q) =>
                  q.id === state.activeQuestionId ? { ...q, ...patch } : q,
                ),
              },
            },
          },
        };
      });
    },
    [],
  );

  const updateActiveQuestionSettings = useCallback(
    (
      settingsPatch: Partial<CodeEditorQuestion["settings"]>,
    ) => {
      setDraft((prev) => {
        const state = prev.workspace.moduleConfig["code-editor"] as
          | CodeEditorModuleState
          | undefined;
        if (!state) return prev;
        return {
          ...prev,
          workspace: {
            ...prev.workspace,
            moduleConfig: {
              ...prev.workspace.moduleConfig,
              "code-editor": {
                ...state,
                questions: state.questions.map((q) =>
                  q.id === state.activeQuestionId
                    ? { ...q, settings: { ...q.settings, ...settingsPatch } }
                    : q,
                ),
              },
            },
          },
        };
      });
    },
    [],
  );

  const addQuestion = useCallback(() => {
    setDraft((prev) => {
      const state = prev.workspace.moduleConfig["code-editor"] as
        | CodeEditorModuleState
        | undefined;
      if (!state) return prev;
      questionCounter++;
      const num = state.questions.length + 1;
      const newQ: CodeEditorQuestion = {
        id: `q-${questionCounter}`,
        number: `Q${num}`,
        problemDescription: "",
        codeDescription: "",
        settings: {
          language: LANGUAGE_DEFAULT,
          difficulty: "easy",
          timerMinutes: 0,
          points: 0,
          hintEnabled: false,
          hintText: "",
        },
      };
      return {
        ...prev,
        workspace: {
          ...prev.workspace,
          moduleConfig: {
            ...prev.workspace.moduleConfig,
            "code-editor": {
              ...state,
              questions: [...state.questions, newQ],
              activeQuestionId: newQ.id,
            },
          },
        },
      };
    });
  }, []);

  const selectQuestion = useCallback((id: string) => {
    setCodeEditorState({ activeQuestionId: id });
  }, [setCodeEditorState]);

  // -------- Validation --------
  const validateStep = useCallback(
    (step: number): StepValidation => {
      switch (step) {
        case 0: {
          const errors: string[] = [];
          if (!draft.overview.title.trim()) errors.push("Title is required");
          return { isValid: errors.length === 0, errors };
        }
        case 1: {
          const errors: string[] = [];
          if (draft.prizes.length === 0)
            errors.push("At least one prize entry is required");
          draft.prizes.forEach((p, i) => {
            if (!p.rank.trim())
              errors.push(`Prize ${i + 1}: Rank is required`);
            if (!p.valueDescription.trim())
              errors.push(`Prize ${i + 1}: Value / Description is required`);
          });
          return { isValid: errors.length === 0, errors };
        }
        case 2: {
          const errors: string[] = [];
          if (draft.timeline.length === 0)
            errors.push("At least one phase is required");
          draft.timeline.forEach((p, i) => {
            if (!p.phaseName.trim())
              errors.push(`Phase ${i + 1}: Phase name is required`);
            if (p.startDate && p.endDate && p.endDate < p.startDate)
              errors.push(`Phase ${i + 1}: End date must not be before start date`);
          });
          return { isValid: errors.length === 0, errors };
        }
        case 3: {
          const errors: string[] = [];
          if (!draft.terms.agreed)
            errors.push("You must agree to the platform's hosting policy");
          if (!draft.terms.richTextContent.trim())
            errors.push("Terms & Conditions content is required");
          return { isValid: errors.length === 0, errors };
        }
        case 4: {
          return { isValid: true, errors: [] };
        }
        default:
          return { isValid: true, errors: [] };
      }
    },
    [draft],
  );

  // -------- Navigation --------
  const canGoNext = useMemo(() => validateStep(currentStep).isValid, [
    currentStep,
    validateStep,
  ]);

  const nextStep = useCallback(() => {
    if (!canGoNext) return;
    setCurrentStep((prev) => Math.min(prev + 1, STEP_LABELS.length - 1));
  }, [canGoNext]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < STEP_LABELS.length) {
      setCurrentStep(step);
    }
  }, []);

  // -------- Draft / Launch (stub — no real backend yet) --------
  const saveDraft = useCallback(async () => {
    return { ok: true };
  }, []);

  const launchCompetition = useCallback(async () => {
    const allValid = STEP_LABELS.every((_, i) => validateStep(i).isValid);
    if (!allValid) return { ok: false, error: "All steps must be valid before launching." };
    return { ok: true };
  }, [validateStep]);

  const activeCodeEditorQuestion = codeEditorState
    ? codeEditorState.questions.find((q) => q.id === codeEditorState.activeQuestionId) ?? null
    : null;

  return {
    currentStep,
    totalSteps: STEP_LABELS.length,
    stepLabels: STEP_LABELS,
    draft,
    validateStep,
    canGoNext,
    nextStep,
    prevStep,
    goToStep,
    saveDraft,
    launchCompetition,
    setCoverImage,
    setOverviewTitle,
    setOverviewDescription,
    addPrize,
    removePrize,
    updatePrize,
    addPhase,
    removePhase,
    updatePhase,
    setTermsContent,
    setTermsAgreed,
    setSelectedModule,
    // Code Editor
    codeEditorState,
    activeCodeEditorQuestion,
    addQuestion,
    selectQuestion,
    updateActiveQuestion,
    updateActiveQuestionSettings,
    isLastStep: currentStep === STEP_LABELS.length - 1,
    isFirstStep: currentStep === 0,
  };
}
