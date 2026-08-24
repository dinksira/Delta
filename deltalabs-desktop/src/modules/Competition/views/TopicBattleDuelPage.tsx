/**
 * TopicBattleDuelPage — duel quiz screen for a joined topic battle.
 * Fetches the battle by route id, builds the MCQ quiz via `buildDuelQuiz`,
 * and drives `QuizBattleTemplate` with `useDuelQuiz` state. When the duel
 * finishes (last question or countdown reaches zero) the completion is
 * recorded on the backend so the battle cannot be taken again.
 *
 * @example
 * ```tsx
 * <TopicBattleDuelPage />
 * ```
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { QuizBattleTemplate } from "@/components/templates/QuizBattleTemplate";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { completeTopicBattle, fetchTopicBattle } from "@/modules/Competition/api";
import { buildDuelQuiz } from "@/modules/Competition/data";
import { useDuelQuiz } from "@/modules/Competition/hooks/useDuelQuiz";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";

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
  const duel = useDuelQuiz(quiz, durationSeconds);

  const completeMutation = useMutation({
    mutationFn: completeTopicBattle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: topicBattleQueryKeys.list });
      queryClient.invalidateQueries({ queryKey: topicBattleQueryKeys.detail(battleId) });
    },
  });

  const finished =
    Boolean(quiz) &&
    duel.state.totalQuestions > 0 &&
    duel.state.currentQuestionIndex >= duel.state.totalQuestions;
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
