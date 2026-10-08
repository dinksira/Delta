/**
 * useDuelQuiz — client state machine for a duel quiz run.
 *
 * Owns the current question index, the in-flight/locked answer for the current
 * question, and a battle-wide countdown timer. It no longer grades: a submitted
 * answer is sent to the backend and the returned verdict becomes `lastResult`.
 * The battle is time-boxed and ends the moment the timer reaches zero,
 * regardless of unanswered questions.
 *
 * The deadline is enforced twice on purpose. The timer here is UX — it stops the
 * player from sitting on a question that no longer counts — but the server
 * applies its own deadline from the participant's join time, so a client that
 * lies about its clock simply has its answers rejected.
 *
 * @example
 * ```ts
 * const duel = useDuelQuiz(quiz, durationSeconds, submitAnswer);
 * duel.submitAnswer({ kind: "multiple_choice", optionId: "opt_a" });
 * // pending -> the server verdict reveals the result
 * ```
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type {
  DuelQuiz,
  DuelState,
  ParticipantAnswer,
} from "@/modules/Competition/types/duelQuiz";
import type { TopicBattleAnswerResult } from "@/modules/Competition/types/integrity";

const SECONDS_PER_QUESTION = 30;

/**
 * Submits one answer and resolves with the server's verdict.
 *
 * Injected rather than imported so this hook stays testable and so the same
 * state machine can serve topic battles and live duels, which grade through
 * their own endpoint.
 */
export type SubmitAnswerFn = (
  questionId: string,
  answer: ParticipantAnswer,
  latencyMs: number,
) => Promise<TopicBattleAnswerResult>;

function formatTimeLeft(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function emptyState(totalQuestions: number): DuelState {
  return {
    currentQuestionIndex: 0,
    answer: null,
    isAnswered: false,
    isSubmitting: false,
    lastResult: null,
    score: 0,
    rank: 1,
    correctCount: 0,
    totalQuestions,
  };
}

export function useDuelQuiz(
  quiz: DuelQuiz | null,
  durationSeconds?: number,
  submitAnswer?: SubmitAnswerFn,
) {
  const totalQuestions = quiz?.questions.length ?? 0;
  const totalTimeSeconds = useMemo(() => {
    if (durationSeconds && durationSeconds > 0) {
      return durationSeconds;
    }
    return Math.max(SECONDS_PER_QUESTION, totalQuestions * SECONDS_PER_QUESTION);
  }, [totalQuestions, durationSeconds]);

  const [state, setState] = useState<DuelState>(() => emptyState(totalQuestions));
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalTimeSeconds);

  // When the current question was first shown. Reported with the answer as
  // advisory latency so the server can flag an impossibly fast response; the
  // server cannot observe this itself and deliberately does not trust it.
  const questionShownAt = useRef<number>(Date.now());
  // Guards against a stale verdict landing after the player has moved on, which
  // would otherwise apply to whatever question happens to be current.
  const submissionToken = useRef(0);
  // Ref mirror of `isSubmitting`, so a double-click cannot fire a second submit
  // before React has re-rendered with the state change.
  const inFlight = useRef(false);

  const finished = state.currentQuestionIndex >= state.totalQuestions;

  useEffect(() => {
    setState(emptyState(totalQuestions));
    setTimeLeftSeconds(totalTimeSeconds);
    questionShownAt.current = Date.now();
  }, [totalQuestions, totalTimeSeconds]);

  // Battle countdown: runs continuously until the duel is finished.
  useEffect(() => {
    if (!quiz || finished) {
      return;
    }
    const timer = setInterval(() => {
      setTimeLeftSeconds((seconds) => {
        if (seconds <= 1) {
          clearInterval(timer);
          return 0;
        }
        return seconds - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [quiz, finished]);

  // End the battle when the timer runs out, even mid-question.
  useEffect(() => {
    if (!quiz || finished) {
      return;
    }
    if (timeLeftSeconds <= 0) {
      setState((prev) => ({ ...prev, currentQuestionIndex: prev.totalQuestions }));
    }
  }, [timeLeftSeconds, quiz, finished, totalQuestions]);

  const doSubmit = useCallback(
    async (answer: ParticipantAnswer) => {
      if (!quiz || !submitAnswer || inFlight.current) {
        return;
      }
      const question = quiz.questions[state.currentQuestionIndex];
      if (!question) {
        return;
      }

      inFlight.current = true;
      const token = ++submissionToken.current;
      const latencyMs = Date.now() - questionShownAt.current;

      setState((prev) => ({ ...prev, answer, isSubmitting: true }));

      try {
        const result = await submitAnswer(question.id, answer, latencyMs);
        // The player may have advanced or the run may have been reset while the
        // request was in flight; drop the verdict rather than misapply it.
        if (token !== submissionToken.current) {
          return;
        }
        setState((prev) => {
          if (prev.currentQuestionIndex !== state.currentQuestionIndex) {
            return prev;
          }
          return {
            ...prev,
            isAnswered: true,
            isSubmitting: false,
            lastResult: result.correct,
            score: result.totalPoints,
            correctCount: result.correctCount,
          };
        });
      } catch {
        if (token !== submissionToken.current) {
          return;
        }
        // Leave the answer unlocked so the player can retry. A failed submit is
        // not a wrong answer, and treating it as one would lose their work.
        setState((prev) => ({ ...prev, isSubmitting: false }));
      } finally {
        if (token === submissionToken.current) {
          inFlight.current = false;
        }
      }
    },
    [quiz, submitAnswer, state.currentQuestionIndex],
  );

  const submit = useCallback(
    (answer: ParticipantAnswer) => {
      void doSubmit(answer);
    },
    [doSubmit],
  );

  const advance = useCallback(() => {
    inFlight.current = false;
    submissionToken.current += 1;
    setState((prev) => {
      if (!prev.isAnswered) {
        return prev;
      }
      const nextIndex = prev.currentQuestionIndex + 1;
      if (nextIndex > prev.totalQuestions) {
        return prev;
      }
      return {
        ...prev,
        currentQuestionIndex: nextIndex,
        answer: null,
        isAnswered: false,
        isSubmitting: false,
        lastResult: null,
      };
    });
    questionShownAt.current = Date.now();
  }, []);

  const reset = useCallback(() => {
    submissionToken.current += 1;
    setState(emptyState(totalQuestions));
    setTimeLeftSeconds(totalTimeSeconds);
    questionShownAt.current = Date.now();
  }, [totalQuestions, totalTimeSeconds]);

  const timeLeft = useMemo(() => formatTimeLeft(timeLeftSeconds), [timeLeftSeconds]);

  return {
    state,
    timeLeft,
    timeLeftSeconds,
    totalTimeSeconds,
    submitAnswer: submit,
    advance,
    reset,
  };
}