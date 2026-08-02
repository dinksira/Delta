/**
 * useDuelQuiz — client state machine for a duel quiz run.
 * Owns the current question index, selected answer, per-question reveal, score,
 * correct count, derived rank, and a countdown timer. Advancing after an answer
 * is locked in scores the question and moves to the next one.
 *
 * @example
 * ```ts
 * const duel = useDuelQuiz(quiz);
 * duel.selectAnswer(1);
 * // question answered -> "Next" auto-advances
 * ```
 */

import { useCallback, useEffect, useMemo, useState } from "react";

import type { DuelQuiz, DuelState } from "@/modules/Competition/types/duelQuiz";

const POINTS_PER_QUESTION = 100;
const QUESTION_TIME_SECONDS = 30;

function formatTimeLeft(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

export function useDuelQuiz(quiz: DuelQuiz | null) {
  const totalQuestions = quiz?.questions.length ?? 0;

  const [state, setState] = useState<DuelState>({
    currentQuestionIndex: 0,
    selectedAnswer: null,
    isAnswered: false,
    score: 0,
    rank: 1,
    correctCount: 0,
    totalQuestions,
  });

  const [timeLeftSeconds, setTimeLeftSeconds] = useState(QUESTION_TIME_SECONDS);

  useEffect(() => {
    setState({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      rank: 1,
      correctCount: 0,
      totalQuestions,
    });
    setTimeLeftSeconds(QUESTION_TIME_SECONDS);
  }, [totalQuestions]);

  // Countdown: resets per question, stops once the duel is finished.
  useEffect(() => {
    if (!quiz || state.isAnswered || state.currentQuestionIndex >= totalQuestions) {
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
  }, [quiz, state.isAnswered, state.currentQuestionIndex, totalQuestions]);

  // Auto-advance when the timer runs out on an unanswered question.
  useEffect(() => {
    if (!quiz || state.isAnswered || state.currentQuestionIndex >= totalQuestions) {
      return;
    }
    if (timeLeftSeconds <= 0) {
      setState((prev) => ({
        ...prev,
        isAnswered: true,
        selectedAnswer: prev.selectedAnswer ?? null,
      }));
    }
  }, [timeLeftSeconds, quiz, state.isAnswered, state.currentQuestionIndex, totalQuestions]);

  const selectAnswer = useCallback(
    (index: number) => {
      if (!quiz) {
        return;
      }
      setState((prev) => {
        if (prev.isAnswered || prev.currentQuestionIndex >= prev.totalQuestions) {
          return prev;
        }
        const question = quiz.questions[prev.currentQuestionIndex];
        const isCorrect = index === question.correctIndex;
        const nextScore = isCorrect ? prev.score + POINTS_PER_QUESTION : prev.score;
        const nextCorrectCount = isCorrect ? prev.correctCount + 1 : prev.correctCount;

        // Position the player on the leaderboard (best-first) based on points.
        const rankedAbove = quiz.leaderboard.filter((entry) => entry.points > nextScore).length;

        return {
          ...prev,
          selectedAnswer: index,
          isAnswered: true,
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
        selectedAnswer: null,
        isAnswered: false,
      };
    });
    setTimeLeftSeconds(QUESTION_TIME_SECONDS);
  }, []);

  const reset = useCallback(() => {
    setState({
      currentQuestionIndex: 0,
      selectedAnswer: null,
      isAnswered: false,
      score: 0,
      rank: 1,
      correctCount: 0,
      totalQuestions,
    });
    setTimeLeftSeconds(QUESTION_TIME_SECONDS);
  }, [totalQuestions]);

  const timeLeft = useMemo(() => formatTimeLeft(timeLeftSeconds), [timeLeftSeconds]);

  return {
    state,
    timeLeft,
    selectAnswer,
    advance,
    reset,
  };
}
