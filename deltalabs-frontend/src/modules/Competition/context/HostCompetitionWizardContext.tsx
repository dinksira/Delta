/**
 * HostCompetitionWizardContext
 * Context + `useReducer` state for the multi-step "Host Competition" wizard:
 * step navigation plus the draft (overview metadata, prize cards, timeline
 * phases, terms, and the workspace — module rail, question tabs, and the
 * shared question-builder canvases built on the `CodingQuestion` model).
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

import { createEmptyQuestion } from "@/modules/Competition/types/createBattle";
import type { CodingQuestion } from "@/modules/Competition/types/createBattle";

// ===== TYPES =====

/**
 * Modules offered in the workspace left rail. Ids match the shared
 * `WORKSPACE_MODULES` constant so the rail and canvases reuse the same keys.
 */
export type HostModuleId = "code" | "question" | "markdown" | "design";

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
  /** Workspace questions — same `CodingQuestion` model as the topic-battle and championship builders. */
  questions: CodingQuestion[];
  activeQuestionId: string | null;
}

export interface HostCompetitionState {
  /** 1-based current step. */
  step: number;
  /** Monotonic id source for prize/phase rows (never `Date.now()`). */
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
  | { type: "SET_ACTIVE_QUESTION"; payload: string }
  | {
      type: "UPDATE_QUESTION";
      payload: { id: string; patch: Partial<CodingQuestion> };
    }
  | { type: "REMOVE_QUESTION"; payload: string }
  | { type: "SAVE_DRAFT" }
  | { type: "LAUNCH" }
  | { type: "RESET" };

// ===== CONSTANTS =====

/** Wizard steps in order; ids double as route-safe step keys. */
export const HOST_COMPETITION_STEPS = [
  { id: "overview", label: "Overview" },
  { id: "prizes", label: "Prize Details" },
  { id: "timeline", label: "Competition Timeline" },
  { id: "terms", label: "Terms & Conditions" },
  { id: "workspace", label: "Competition Workspace" },
] as const;

export const HOST_COMPETITION_STEP_COUNT = HOST_COMPETITION_STEPS.length;

/** Seeded on first render so the Code Editor module opens with a live question. */
const INITIAL_QUESTION = createEmptyQuestion();

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
    questions: [INITIAL_QUESTION],
    activeQuestionId: INITIAL_QUESTION.id,
  },
  draftSavedAt: null,
  launched: false,
};

// ===== HELPERS =====

function patchRow<T extends { id: number }>(rows: T[], id: number, patch: Partial<T>): T[] {
  return rows.map((row) => (row.id === id ? { ...row, ...patch } : row));
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
      const question = createEmptyQuestion();
      return {
        ...state,
        draft: {
          ...draft,
          questions: [...draft.questions, question],
          activeQuestionId: question.id,
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
          questions: draft.questions.map((question) =>
            question.id === action.payload.id ? { ...question, ...action.payload.patch } : question,
          ),
        },
      };
    case "REMOVE_QUESTION": {
      const filtered = draft.questions.filter((question) => question.id !== action.payload);
      return {
        ...state,
        draft: {
          ...draft,
          questions: filtered,
          activeQuestionId: filtered.length > 0 ? filtered[filtered.length - 1].id : null,
        },
      };
    }
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
