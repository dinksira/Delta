/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useIntegrityMonitor } from "@/modules/Competition/hooks/useIntegrityMonitor";
import type { IntegrityEventType } from "@/modules/Competition/types/integrity";

/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */

type ReportInput = {
  battleId: string;
  eventType: IntegrityEventType;
  questionId?: string;
  detail?: Record<string, unknown>;
};

/** Stands in for the API client so no network call is attempted. */
function makeReport() {
  const calls: ReportInput[] = [];
  const report = vi.fn(async (input: ReportInput) => {
    calls.push(input);
    return { recorded: true, violationCount: 0, autoFlagged: false };
  });
  return { calls, report };
}

/** Drives the visibility API, which jsdom does not wire up for us. */
function setVisibility(state: "hidden" | "visible") {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event("visibilitychange"));
}

/** ################################ /HELPERS ############################ */

/** ################################ TESTS ############################# */

describe("useIntegrityMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    setVisibility("visible");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("reports a tab switch with the question in view", () => {
    const { calls, report } = makeReport();
    const { rerender } = renderHook(
      (props: { questionId?: string }) =>
        useIntegrityMonitor({ battleId: "b1", enabled: true, questionId: props.questionId, report }),
      { initialProps: { questionId: "q1" } },
    );

    rerender({ questionId: "q2" });
    setVisibility("hidden");

    expect(calls).toEqual([
      { battleId: "b1", eventType: "tab_hidden", questionId: "q2", detail: { visibilityState: "hidden" } },
    ]);
  });

  it("reports window blur once per occurrence", () => {
    const { calls, report } = makeReport();
    renderHook(() => useIntegrityMonitor({ battleId: "b1", enabled: true, report }));

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(calls.map((c) => c.eventType)).toEqual(["window_blur"]);
  });

  it("debounces repeats so one stray switch cannot flood the queue", () => {
    const { calls, report } = makeReport();
    renderHook(() => useIntegrityMonitor({ battleId: "b1", enabled: true, report }));

    act(() => {
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("blur"));
      window.dispatchEvent(new Event("blur"));
    });
    expect(calls).toHaveLength(1);

    // A later switch is still reported — the debounce is a rate limit, not a
    // suppression of the signal entirely.
    act(() => {
      vi.advanceTimersByTime(1_500);
      window.dispatchEvent(new Event("blur"));
    });
    expect(calls).toHaveLength(2);
  });

  it("attaches nothing while disabled", () => {
    const { calls, report } = makeReport();
    const { rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useIntegrityMonitor({ battleId: "b1", enabled: props.enabled, report }),
      { initialProps: { enabled: false } },
    );

    setVisibility("hidden");
    act(() => {
      window.dispatchEvent(new Event("blur"));
    });
    expect(calls).toHaveLength(0);

    rerender({ enabled: true });
    setVisibility("hidden");
    expect(calls.map((c) => c.eventType)).toEqual(["tab_hidden"]);
  });

  it("swallows a failing report rather than interrupting the quiz", () => {
    const report = vi.fn(async () => {
      throw new Error("network down");
    });
    renderHook(() => useIntegrityMonitor({ battleId: "b1", enabled: true, report }));

    expect(() =>
      act(() => {
        window.dispatchEvent(new Event("blur"));
      }),
    ).not.toThrow();
  });

  it("does not require a question id", () => {
    const { calls, report } = makeReport();
    renderHook(() => useIntegrityMonitor({ battleId: "b1", enabled: true, report }));

    act(() => {
      window.dispatchEvent(new Event("blur"));
    });

    expect(calls[0]?.questionId).toBeUndefined();
  });
});