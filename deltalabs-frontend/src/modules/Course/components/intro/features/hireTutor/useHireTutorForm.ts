/** ################################ HOOK ############################# */
/**
 * Owns every piece of state for the Hire a Tutor form.
 *
 * The presentational sections stay stateless so they can be rendered and tested
 * in isolation, and so the same state can later be driven by a route loader
 * without moving logic into the components.
 */

/** React core, types, and data. */
import { useCallback, useMemo, useState } from "react";

import type { PaymentOption } from "@/components/organisms/PaymentOptionDropdown/PaymentOptionDropdown.types";
import type { RoadmapSelection } from "@/components/organisms/RoadmapSelectionModal/RoadmapSelectionModal.types";
import type { CustomParameter } from "@/components/organisms/CustomParametersModal/CustomParametersModal.types";
import { DEFAULT_SESSION_HOURS, HIRE_TUTOR_PAYMENT_OPTIONS, TUTOR_HOURLY_RATE } from "./hireTutorData";
import type { HireTutorDialog, HireTutorFormState } from "./types";

/** Props for {@link useHireTutorForm}. */
export interface UseHireTutorFormOptions {
  /** Initial state, e.g. when rehydrating a draft. */
  initialState?: Partial<HireTutorFormState>;
  /** Fired whenever the state changes. */
  onChange?: (state: HireTutorFormState) => void;
}

/** A blank form. Shared so `reset` and the initial state cannot drift apart. */
const EMPTY_FORM: HireTutorFormState = {
  description: "",
  customParameters: [],
  roadmapSectionIds: [],
  roadmapResourceIds: [],
  tutorIds: [],
  scheduledDate: "",
  scheduledTime: "",
  paymentOptionId: "",
  amount: "",
  autoMatch: false,
};

/** Adds or removes an id, returning a new array. */
function toggleId(ids: readonly string[], id: string): string[] {
  return ids.includes(id) ? ids.filter((current) => current !== id) : [...ids, id];
}

/** Parses the amount field, ignoring anything non-numeric. */
function parseAmount(amount: string): number {
  const parsed = Number.parseFloat(amount);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

/** Values derived from the form state, kept out of the main hook. */
function useHireTutorDerived(form: HireTutorFormState) {
  const selectedPaymentOption = useMemo(
    () => HIRE_TUTOR_PAYMENT_OPTIONS.find((option) => option.id === form.paymentOptionId) ?? null,
    [form.paymentOptionId],
  );

  const sessionHours = DEFAULT_SESSION_HOURS;

  // A typed amount wins; otherwise fall back to rate x hours once a method is set.
  const estimatedAmount = useMemo(() => {
    const typed = parseAmount(form.amount);
    if (typed > 0) {
      return typed;
    }
    return form.paymentOptionId ? TUTOR_HOURLY_RATE * sessionHours : 0;
  }, [form.amount, form.paymentOptionId, sessionHours]);

  const isComplete = useMemo(
    () =>
      form.description.trim().length > 0 &&
      form.scheduledDate !== "" &&
      form.paymentOptionId !== "" &&
      (form.tutorIds.length > 0 || form.autoMatch),
    [form],
  );

  return { selectedPaymentOption, sessionHours, estimatedAmount, isComplete };
}

/** Setters for the scheduled session and its cost. */
function useScheduleSetters(patch: PatchFn) {
  const setAmount = useCallback((amount: string) => patch({ amount }), [patch]);
  const setScheduledTime = useCallback((scheduledTime: string) => patch({ scheduledTime }), [patch]);
  const setPaymentOption = useCallback(
    (option: PaymentOption) => patch({ paymentOptionId: option.id }),
    [patch],
  );

  // Changing the date invalidates the slot, so the stale time is cleared.
  const setScheduledDate = useCallback(
    (scheduledDate: string) => patch({ scheduledDate, scheduledTime: "" }),
    [patch],
  );

  return { setAmount, setScheduledDate, setScheduledTime, setPaymentOption };
}

/** Setters for the description and the attached selections. */
function useSelectionSetters(form: HireTutorFormState, patch: PatchFn) {
  const setDescription = useCallback((description: string) => patch({ description }), [patch]);
  const setAutoMatch = useCallback((autoMatch: boolean) => patch({ autoMatch }), [patch]);
  const setCustomParameters = useCallback(
    (customParameters: CustomParameter[]) => patch({ customParameters }),
    [patch],
  );
  const confirmTutors = useCallback((tutorIds: string[]) => patch({ tutorIds }), [patch]);

  const toggleTutor = useCallback(
    (tutorId: string) => patch({ tutorIds: toggleId(form.tutorIds, tutorId) }),
    [form.tutorIds, patch],
  );

  const toggleRoadmapSection = useCallback(
    (sectionId: string) => patch({ roadmapSectionIds: toggleId(form.roadmapSectionIds, sectionId) }),
    [form.roadmapSectionIds, patch],
  );

  const toggleRoadmapResource = useCallback(
    (resourceId: string) => patch({ roadmapResourceIds: toggleId(form.roadmapResourceIds, resourceId) }),
    [form.roadmapResourceIds, patch],
  );

  const applyRoadmapSelection = useCallback(
    (selection: RoadmapSelection) =>
      patch({ roadmapSectionIds: selection.sectionIds, roadmapResourceIds: selection.resourceIds }),
    [patch],
  );

  return {
    setDescription,
    setAutoMatch,
    setCustomParameters,
    toggleTutor,
    confirmTutors,
    toggleRoadmapSection,
    toggleRoadmapResource,
    applyRoadmapSelection,
  };
}

/** Merges a change into the current state. */
type PatchFn = (changes: Partial<HireTutorFormState>) => void;

/** Every setter the form exposes, derived from the current state. */
function useHireTutorSetters(form: HireTutorFormState, publish: (next: HireTutorFormState) => void) {
  const patch = useCallback(
    (changes: Partial<HireTutorFormState>) => publish({ ...form, ...changes }),
    [form, publish],
  );

  return { ...useScheduleSetters(patch), ...useSelectionSetters(form, patch) };
}

/** The Hire a Tutor form state machine. */
export function useHireTutorForm({ initialState, onChange }: UseHireTutorFormOptions = {}) {
  const [form, setForm] = useState<HireTutorFormState>({ ...EMPTY_FORM, ...initialState });
  const [openDialog, setOpenDialog] = useState<HireTutorDialog>(null);

  // Publishes every change to the caller as well as to React state.
  const publish = useCallback(
    (next: HireTutorFormState) => {
      setForm(next);
      onChange?.(next);
    },
    [onChange],
  );

  const openPicker = useCallback(
    (dialog: Exclude<HireTutorDialog, null>) => setOpenDialog(dialog),
    [],
  );
  const closePicker = useCallback(() => setOpenDialog(null), []);
  const reset = useCallback(() => publish(EMPTY_FORM), [publish]);

  return {
    form,
    openDialog,
    openPicker,
    closePicker,
    reset,
    ...useHireTutorSetters(form, publish),
    ...useHireTutorDerived(form),
  };
}

/** The value returned by {@link useHireTutorForm}. */
export type HireTutorFormApi = ReturnType<typeof useHireTutorForm>;
/** ################################ /HOOK ############################# */
