/**
 * HostCompetitionWizardContext
 * Context + `useReducer` state for the multi-step "Host Competition" wizard:
 * step navigation plus the draft (overview metadata, prize cards, timeline
 * phases, terms, and the IDE workspace — active module, question tabs, and
 * module settings).
 *
 * @example
 * ```tsx
 * <HostCompetitionWizardProvider>
 *   <HostCompetitionWizard />
 * </HostCompetitionWizardProvider>
 * ```
 */

"use client";

import { createContext, useContext, useReducer, type Dispatch, type ReactNode } from "react";

// ===== TYPES =====

/** Modules offered in the workspace left rail. */
export type HostModuleId = "code-editor" | "question-builder" | "markdown-pad" | "design-canvas";

/** One repeatable prize entry (Step 2). */
export interface PrizeDraft {
  id: number;
  rank: string;
  type: string;
  value: string;
  condition: string;
}

/** One repeatable timeline phase entry (Step 3). */
export interface PhaseDraft {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
}

/** One question tab in the workspace code editor (Step 5). */
export interface WorkspaceQuestion {
  id: number;
  label: string;
  description: string;
  code: string;
}

/** Right-rail module settings for the workspace. */
export interface ModuleSettingsDraft {
  language: string;
  difficulty: string;
  timer: string;
  points: string;
  hintEnabled: boolean;
}

/** Everything the wizard collects before launch. */
export interface HostCompetitionDraft {
  title: string;
  description: string;
  coverName: string | null;
  prizes: PrizeDraft[];
  phases: PhaseDraft[];
  termsHtml: string;
  termsConfirmed: boolean;
  activeModule: HostModuleId | null;
  questions: WorkspaceQuestion[];
  activeQuestionId: number | null;
  moduleSettings: ModuleSettingsDraft;
}

export interface HostCompetitionState {
  /** 1-based current step. */
  step: number;
  /** Monotonic id source for prize/phase/question rows (never `Date.now()`). */
  seq: number;
  draft: HostCompetitionDraft;
  draftSavedAt: string | null;
  launched: boolean;
}

export type HostCompetitionAction =
  | { type: "SET_STEP"; payload: number }
  | { type: "NEXT_STEP" }
  | { type: "PREVIOUS_STEP" }
  | { type: "UPDATE_DRAFT"; payload: Partial<HostCompetitionDraft> }
  | { type: "ADD_PRIZE" }
  | { type: "UPDATE_PRIZE"; payload: { id: number; patch: Partial<PrizeDraft> } }
  | { type: "REMOVE_PRIZE"; payload: number }
  | { type: "ADD_PHASE" }
  | { type: "UPDATE_PHASE"; payload: { id: number; patch: Partial<PhaseDraft> } }
  | { type: "REMOVE_PHASE"; payload: number }
  | { type: "SET_ACTIVE_MODULE"; payload: HostModuleId | null }
  | { type: "ADD_QUESTION" }
  | { type: "SET_ACTIVE_QUESTION"; payload: number }
  | { type: "UPDATE_QUESTION"; payload: { id: number; patch: Partial<WorkspaceQuestion> } }
  | { type: "UPDATE_MODULE_SETTINGS"; payload: Partial<ModuleSettingsDraft> }
  | { type: "SAVE_DRAFT" }
  | { type: "LAUNCH" }
  | { type: "RESET" };

// ===== CONSTANTS =====

/** Seed line shown in every new code question tab. */
export const QUESTION_CODE_SEED = "// Write the code problem here";

/** Wizard steps in order; ids double as route-safe step keys. */
export const HOST_COMPETITION_STEPS = [
  { id: "overview", label: "Overview" },
  { id: "prizes", label: "Prize Details" },
  { id: "timeline", label: "Competition Timeline" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "workspace", label: "Competition Workspace" },
] as const;

export const HOST_COMPETITION_STEP_COUNT = HOST_COMPETITION_STEPS.length;

const INITIAL_SETTINGS: ModuleSettingsDraft = {
  language: "HTML",
  difficulty: "EASY",
  timer: "",
  points: "",
  hintEnabled: false,
};

function initialQuestion(id: number): WorkspaceQuestion {
  return { id, label: "Q1.", description: "", code: QUESTION_CODE_SEED };
}

export const hostCompetitionInitialState: HostCompetitionState = {
  step: 1,
  seq: 4,
  draft: {
    title: "",
    description: "",
    coverName: null,
    prizes: [{ id: 1, rank: "", type: "Money", value: "", condition: "" }],
    phases: [{ id: 2, name: "", description: "", startDate: "", endDate: "" }],
    termsHtml: "",
    termsConfirmed: false,
    activeModule: null,
    questions: [initialQuestion(3)],
    activeQuestionId: 3,
    moduleSettings: { ...INITIAL_SETTINGS },
  },
  draftSavedAt: null,
  launched: false,
};

// ===== HELPERS =====

function patchRow<T extends { id: number }>(rows: T[], id: number, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
}

function nextQuestionLabel(count: number): string {
  return `Q${count + 1}.`;
}

// ===== REDUCER =====

export function hostCompetitionReducer(
  state: HostCompetitionState,
  action: HostCompetitionAction,
): HostCompetitionState {
  const { draft } = state;
  switch (action.type) {
    case "SET_STEP":
      return {
        ...state,
        step: Math.min(Math.max(action.payload, 1), HOST_COMPETITION_STEP_COUNT),
      };
    case "NEXT_STEP":
      return { ...state, step: Math.min(state.step + 1, HOST_COMPETITION_STEP_COUNT) };
    case "PREVIOUS_STEP":
      return { ...state, step: Math.max(state.step - 1, 1) };
    case "UPDATE_DRAFT":
      return { ...state, draft: { ...draft, ...action.payload } };
    case "ADD_PRIZE":
      return {
        ...state,
        seq: state.seq + 1,
        draft: {
          ...draft,
          prizes: [
            ...draft.prizes,
            { id: state.seq, rank: "", type: "Money", value: "", condition: "" },
          ],
        },
      };
    case "UPDATE_PRIZE":
      return {
        ...state,
        draft: {
          ...draft,
          prizes: patchRow(draft.prizes, action.payload.id, action.payload.patch),
        },
      };
    case "REMOVE_PRIZE":
      return {
        ...state,
        draft: { ...draft, prizes: draft.prizes.filter((prize) => prize.id !== action.payload) },
      };
    case "ADD_PHASE":
      return {
        ...state,
        seq: state.seq + 1,
        draft: {
          ...draft,
          phases: [
            ...draft.phases,
            { id: state.seq, name: "", description: "", startDate: "", endDate: "" },
          ],
        },
      };
    case "UPDATE_PHASE":
      return {
        ...state,
        draft: {
          ...draft,
          phases: patchRow(draft.phases, action.payload.id, action.payload.patch),
        },
      };
    case "REMOVE_PHASE":
      return {
        ...state,
        draft: { ...draft, phases: draft.phases.filter((phase) => phase.id !== action.payload) },
      };
    case "SET_ACTIVE_MODULE":
      return { ...state, draft: { ...draft, activeModule: action.payload } };
    case "ADD_QUESTION": {
      const id = state.seq;
      const question = { ...initialQuestion(id), label: nextQuestionLabel(draft.questions.length) };
      return {
        ...state,
        seq: state.seq + 1,
        draft: {
          ...draft,
          questions: [...draft.questions, question],
          activeQuestionId: id,
        },
      };
    }
    case "SET_ACTIVE_QUESTION":
      return { ...state, draft: { ...draft, activeQuestionId: action.payload } };
    case "UPDATE_QUESTION":
      return {
        ...state,
        draft: {
          ...draft,
          questions: patchRow(draft.questions, action.payload.id, action.payload.patch),
        },
      };
    case "UPDATE_MODULE_SETTINGS":
      return {
        ...state,
        draft: {
          ...draft,
          moduleSettings: { ...draft.moduleSettings, ...action.payload },
        },
      };
    case "SAVE_DRAFT":
      return { ...state, draftSavedAt: new Date().toISOString() };
    case "LAUNCH":
      return { ...state, launched: true };
    case "RESET":
      return hostCompetitionInitialState;
    default:
      return state;
  }
}

// ===== CONTEXT =====

export interface HostCompetitionWizardContextValue {
  state: HostCompetitionState;
  dispatch: Dispatch<HostCompetitionAction>;
}

const HostCompetitionWizardContext = createContext<HostCompetitionWizardContextValue | undefined>(
  undefined,
);

export function HostCompetitionWizardProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [state, dispatch] = useReducer(hostCompetitionReducer, hostCompetitionInitialState);
  return (
    <HostCompetitionWizardContext.Provider value={{ state, dispatch }}>
      {children}
    </HostCompetitionWizardContext.Provider>
  );
}

export function useHostCompetitionWizard(): HostCompetitionWizardContextValue {
  const value = useContext(HostCompetitionWizardContext);
  if (!value) {
    throw new Error("useHostCompetitionWizard must be used within HostCompetitionWizardProvider");
  }
  return value;
}

export default HostCompetitionWizardContext;
