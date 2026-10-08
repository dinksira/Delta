/**
 * useIntegrityMonitor — reports proctoring signals during a graded attempt.
 *
 * Watches the four behaviours an unattended participant cannot avoid:
 * hiding the tab, blurring the window, leaving fullscreen, and pasting text into
 * an answer. Each is reported once per occurrence with a short debounce, because
 * `visibilitychange` fires on every tab switch *and* every window minimize, and
 * an unfiltered stream would bury a reviewer in noise.
 *
 * These signals are advisory. They open an organizer review queue entry and
 * never change a score, because every one of them is forgeable by a participant
 * who decides to spoof them — the value is catching the careless case, not
 * defeating a motivated cheater. The client is therefore not asked to police
 * itself: it reports what it observes and the server decides what it means.
 *
 * @example
 * ```ts
 * const integrity = useIntegrityMonitor({
 *   battleId,
 *   enabled: started && !finished,
 *   questionId: currentQuestionId,
 * });
 * ```
 */

"use client";

import { useCallback, useEffect, useRef } from "react";

import { recordTopicBattleIntegrityEvent } from "@/modules/Competition/api";
import type { IntegrityEventType } from "@/modules/Competition/types/integrity";

/** Minimum gap between two reports of the same kind. */
const DEBOUNCE_MS = 1_000;

export interface UseIntegrityMonitorOptions {
  battleId: string;
  /** Only monitor while an attempt is live; pass false before/after the duel. */
  enabled: boolean;
  /** Question in view, attached to each report for reviewer context. */
  questionId?: string;
  /** Override the reporter, for tests. */
  report?: typeof recordTopicBattleIntegrityEvent;
}

export interface IntegrityMonitor {
  /** Manually report a signal (used for paste blocking). */
  reportEvent: (eventType: IntegrityEventType, detail?: Record<string, unknown>) => void;
}

export function useIntegrityMonitor(options: UseIntegrityMonitorOptions): IntegrityMonitor {
  const { battleId, enabled, questionId, report = recordTopicBattleIntegrityEvent } = options;

  // Refs, not state: the listeners are registered once and must read the latest
  // values without re-subscribing on every question change.
  const questionIdRef = useRef(questionId);
  questionIdRef.current = questionId;
  const lastReportedAt = useRef<Partial<Record<IntegrityEventType, number>>>({});
  const reportRef = useRef(report);
  reportRef.current = report;

  const reportEvent = useCallback(
    (eventType: IntegrityEventType, detail?: Record<string, unknown>) => {
      const now = Date.now();
      const last = lastReportedAt.current[eventType] ?? 0;
      if (now - last < DEBOUNCE_MS) {
        return;
      }
      lastReportedAt.current[eventType] = now;

      // Fire-and-forget: a proctoring report must never interrupt the quiz, and
      // a failure here is not something the player can act on.
      void reportRef
        .current({
          battleId,
          eventType,
          questionId: questionIdRef.current,
          detail,
        })
        .catch(() => undefined);
    },
    [battleId],
  );

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        reportEvent("tab_hidden", { visibilityState: document.visibilityState });
      }
    };

    const onBlur = () => reportEvent("window_blur");
    const onPaste = () => reportEvent("answer_pasted");
    const onCopy = () => reportEvent("copy_attempt");

    const onFullscreenChange = () => {
      // Only meaningful if the attempt actually opened fullscreen; otherwise
      // every ordinary state change would log a spurious exit.
      if (!document.fullscreenElement && document.hasFocus()) {
        reportEvent("fullscreen_exit");
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    window.addEventListener("paste", onPaste, true);
    window.addEventListener("copy", onCopy, true);
    document.addEventListener("fullscreenchange", onFullscreenChange);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("paste", onPaste, true);
      window.removeEventListener("copy", onCopy, true);
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, [enabled, reportEvent]);

  return { reportEvent };
}