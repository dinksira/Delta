/**
 * useDuelQuiz — client state machine for a duel quiz run.
 * Owns the current question index, the submitted answer for the current
 * question, auto-grading of objective kinds, score / correct count / derived
 * rank, and a battle-wide countdown timer. The battle is time-boxed and ends
 * automatically the moment the timer reaches zero, regardless of unanswered
 * questions.
 *
 * @example
 * ```ts
 * const duel = useDuelQuiz(quiz);
 * duel.submitAnswer({ kind: "multiple_choice", optionId: "opt_a" });
 * // graded & revealed -> "Next" auto-advances
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  gradeQuestion,
  type DuelQuiz,
  type DuelState,
  type ParticipantAnswer,
} from "@/modules/Competition/types/duelQuiz";

const POINTS_PER_QUESTION = 100;
const SECONDS_PER_QUESTION = 30;

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
    lastResult: null,
    score: 0,
    rank: 1,
    correctCount: 0,
    totalQuestions,
  };
}

export function useDuelQuiz(quiz: DuelQuiz | null, durationSeconds?: number) {
  const totalQuestions = quiz?.questions.length ?? 0;
  const totalTimeSeconds = useMemo(() => {
    if (durationSeconds && durationSeconds > 0) {
      return durationSeconds;
    }
    return Math.max(SECONDS_PER_QUESTION, totalQuestions * SECONDS_PER_QUESTION);
  }, [totalQuestions, durationSeconds]);

  const [state, setState] = useState<DuelState>(() => emptyState(totalQuestions));
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(totalTimeSeconds);

  const finished = state.currentQuestionIndex >= state.totalQuestions;

  useEffect(() => {
    setState(emptyState(totalQuestions));
    setTimeLeftSeconds(totalTimeSeconds);
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

  const submitAnswer = useCallback(
    (answer: ParticipantAnswer) => {
      if (!quiz) {
        return;
      }
      setState((prev) => {
        if (prev.isAnswered || prev.currentQuestionIndex >= prev.totalQuestions) {
          return prev;
        }
        const question = quiz.questions[prev.currentQuestionIndex];
        const result = gradeQuestion(question, answer);
        const gained = result === true ? POINTS_PER_QUESTION : 0;
        const nextScore = prev.score + gained;
        const nextCorrectCount = result === true ? prev.correctCount + 1 : prev.correctCount;

        // Position the player on the leaderboard (best-first) based on points.
        const rankedAbove = quiz.leaderboard.filter((entry) => entry.points > nextScore).length;

        return {
          ...prev,
          answer,
          isAnswered: true,
          lastResult: result,
          score: nextScore,
          correctCount: nextCorrectCount,
          rank: rankedAbove + 1,
        };
      });
    },
    [quiz],
  );

  const advance = useCallback(() => {
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
        lastResult: null,
      };
    });
  }, []);

  const reset = useCallback(() => {
    setState(emptyState(totalQuestions));
    setTimeLeftSeconds(totalTimeSeconds);
  }, [totalQuestions, totalTimeSeconds]);

  const timeLeft = useMemo(() => formatTimeLeft(timeLeftSeconds), [timeLeftSeconds]);

  return {
    state,
    timeLeft,
    timeLeftSeconds,
    totalTimeSeconds,
    submitAnswer,
    advance,
    reset,
  };
}