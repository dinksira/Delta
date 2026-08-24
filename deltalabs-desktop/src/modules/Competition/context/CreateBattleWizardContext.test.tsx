/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  CreateBattleWizardProvider,
  useCreateBattleWizard,
} from "@/modules/Competition/context";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
describe("CreateBattleWizardContext", () => {
  function useWizard() {
    const {
      currentStep,
      draft,
      goToStep,
      canGoNext,
      selectVisibility,
      updateSchedule,
      steps,
      totalSteps,
    } = useCreateBattleWizard();
    return {
      currentStep,
      draft,
      goToStep,
      canGoNext,
      selectVisibility,
      updateSchedule,
      steps,
      totalSteps,
    };
  }

  it("gates step 3 on a complete schedule once 'Schedule Later' is chosen", () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: CreateBattleWizardProvider,
    });

    act(() => result.current.goToStep(3));
    expect(result.current.canGoNext).toBe(true);

    act(() => result.current.selectVisibility("public", "schedule"));
    expect(result.current.draft.visibility.timing).toBe("schedule");
    expect(result.current.canGoNext).toBe(false);

    act(() =>
      result.current.updateSchedule("2026-09-01", "18:00", "UTC"),
    );
    expect(result.current.canGoNext).toBe(true);
  });

  it("keeps 'Start Instantly' flowable without a schedule", () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: CreateBattleWizardProvider,
    });

    act(() => result.current.goToStep(3));
    act(() => result.current.selectVisibility("public", "instant"));
    expect(result.current.canGoNext).toBe(true);
  });

  it("drops the Date & Time step for 'Start Instantly'", () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: CreateBattleWizardProvider,
    });

    expect(result.current.totalSteps).toBe(7);
    expect(result.current.steps.map((s) => s.id)).not.toContain("date-time");

    act(() => result.current.selectVisibility("public", "schedule"));
    expect(result.current.totalSteps).toBe(8);
    expect(result.current.steps.map((s) => s.id)).toContain("date-time");

    act(() => result.current.selectVisibility("public", "instant"));
    expect(result.current.totalSteps).toBe(7);
    expect(result.current.steps.map((s) => s.id)).not.toContain("date-time");
  });

  it("clamps currentStep when the step count shrinks to instant", () => {
    const { result } = renderHook(() => useWizard(), {
      wrapper: CreateBattleWizardProvider,
    });

    act(() => result.current.selectVisibility("public", "schedule"));
    act(() => result.current.goToStep(8));
    expect(result.current.currentStep).toBe(8);

    act(() => result.current.selectVisibility("public", "instant"));
    expect(result.current.totalSteps).toBe(7);
    expect(result.current.currentStep).toBe(7);
  });
});
/** ################################ /COMPONENT ############################# */
