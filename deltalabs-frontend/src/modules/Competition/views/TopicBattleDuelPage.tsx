/**
 * TopicBattleDuelPage — duel quiz screen for a joined topic battle.
 * Fetches the battle by route id, builds the quiz via `buildDuelQuiz`, and
 * drives `QuizBattleTemplate` with `useDuelQuiz` state. Answers are graded by
 * the backend: this page submits each answer and renders the returned verdict,
 * so the client never holds an answer key. Proctoring signals (tab switch,
 * fullscreen exit, paste) are reported alongside via `useIntegrityMonitor`.
 *
 * Completion is recorded only after the last question, and the server now
 * refuses it unless at least one answer was actually graded — so finishing is
 * no longer a free action.
 *
 * @example
 * ```tsx
 * <TopicBattleDuelPage />
 * ```
 */

"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2, Settings2 } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { QuizBattleTemplate } from "@/components/templates/QuizBattleTemplate";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  completeTopicBattle,
  fetchTopicBattle,
  submitTopicBattleAnswer,
} from "@/modules/Competition/api";
import { buildDuelQuiz } from "@/modules/Competition/data";
import { useDuelQuiz } from "@/modules/Competition/hooks/useDuelQuiz";
import { useIntegrityMonitor } from "@/modules/Competition/hooks/useIntegrityMonitor";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";
import type { ParticipantAnswer } from "@/modules/Competition/types/duelQuiz";

export function TopicBattleDuelPage() {
  const params = useParams();
  const router = useRouter();
  const battleId = params?.id as string;
  const { isAuthenticated } = useAuthSession();
  const queryClient = useQueryClient();

  const { data: battle, isPending, error } = useQuery({
    queryKey: topicBattleQueryKeys.detail(battleId),
    queryFn: () => fetchTopicBattle(battleId),
  });

  const quiz = useMemo(() => (battle ? buildDuelQuiz(battle) : null), [battle]);
  const durationSeconds = battle?.durationMinutes ? battle.durationMinutes * 60 : undefined;

  // Server-graded submission. Kept as a mutation factory rather than a hook so
  // the callback identity stays stable across renders; `useDuelQuiz` depends on
  // it and would otherwise re-arm its effect on every question change.
  const answerMutation = useMutation({
    mutationFn: (input: {
      questionId: string;
      answer: ParticipantAnswer;
      latencyMs: number;
    }) =>
      submitTopicBattleAnswer({
        battleId,
        questionId: input.questionId,
        answer: input.answer,
        latencyMs: input.latencyMs,
      }),
  });

  const submitToServer = useCallback(
    async (questionId: string, answer: ParticipantAnswer, latencyMs: number) =>
      answerMutation.mutateAsync({ questionId, answer, latencyMs }),
    [answerMutation],
  );

  const duel = useDuelQuiz(quiz, durationSeconds, isAuthenticated ? submitToServer : undefined);

  // Proctoring signals, active only while an attempt is actually in progress.
  const finished =
    Boolean(quiz) &&
    duel.state.totalQuestions > 0 &&
    duel.state.currentQuestionIndex >= duel.state.totalQuestions;
  const currentQuestionId = quiz?.questions[duel.state.currentQuestionIndex]?.id;

  useIntegrityMonitor({
    battleId,
    enabled: isAuthenticated && Boolean(quiz) && !finished,
    questionId: currentQuestionId,
  });

  const completeMutation = useMutation({
    mutationFn: completeTopicBattle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicBattleQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: topicBattleQueryKeys.detail(battleId) });
    },
  });

  const completionSent = useRef(false);
  useEffect(() => {
    if (finished && isAuthenticated && !completionSent.current) {
      completionSent.current = true;
      completeMutation.mutate(battleId);
    }
  }, [finished, isAuthenticated, battleId, completeMutation]);

  const handleBack = () => {
    router.push("/features/competitions/topic-battles");
  };

  const handleExit = () => {
    router.push("/features/competitions/topic-battles");
  };

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center gap-2 p-6 text-text-secondary">
        <Loader2 className="size-5 animate-spin" aria-hidden />
        Loading battle...
      </div>
    );
  }

  if (error || !battle || !quiz) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-text-secondary">
          {error instanceof Error && error.message.includes("404")
            ? "Battle not found"
            : "Failed to load this battle"}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => router.push("/features/competitions/topic-battles")}
          >
            Browse battles
          </Button>
        </div>
      </div>
    );
  }

  if (battle.isOwner) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <Settings2 className="size-10 text-primary-600" aria-hidden />
        <h2 className="text-lg font-semibold text-text-primary">You host this battle</h2>
        <p className="max-w-md text-sm text-text-secondary">
          Manage and track it from the battle page. Only participants can play a duel — you
          cannot take part in a battle you created.
        </p>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push(`/features/competitions/${battle.id}`)}
          >
            <Settings2 className="size-4" />
            Manage &amp; Track
          </Button>
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Browse battles
          </Button>
        </div>
      </div>
    );
  }

  if (battle.hasCompleted) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6 text-center">
        <CheckCircle2 className="size-10 text-success-600" aria-hidden />
        <h2 className="text-lg font-semibold text-text-primary">Battle Completed</h2>
        <p className="max-w-md text-sm text-text-secondary">
          You have already finished this battle. Each battle can only be attempted once.
        </p>
        <Button variant="primary" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Back to Battles
        </Button>
      </div>
    );
  }

  return (
    <QuizBattleTemplate
      quiz={quiz}
      state={duel.state}
      timeLeft={duel.timeLeft}
      timeLeftSeconds={duel.timeLeftSeconds}
      timeTotalSeconds={duel.totalTimeSeconds}
      onSubmit={duel.submitAnswer}
      onAdvance={duel.advance}
      onExit={handleExit}
    />
  );
}

export default TopicBattleDuelPage;
