/**
 * TopicBattleDuelPage — duel quiz screen for a joined topic battle.
 * Fetches the battle by route id, builds the MCQ quiz via `buildDuelQuiz`,
 * and drives `QuizBattleTemplate` with `useDuelQuiz` state.
 *
 * @example
 * ```tsx
 * <TopicBattleDuelPage />
 * ```
 */

"use client";

import { useMemo } from "react";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { QuizBattleTemplate } from "@/components/templates/QuizBattleTemplate";
import { fetchTopicBattle } from "@/modules/Competition/api";
import { buildDuelQuiz } from "@/modules/Competition/data";
import { useDuelQuiz } from "@/modules/Competition/hooks/useDuelQuiz";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";

export function TopicBattleDuelPage() {
  const params = useParams();
  const router = useRouter();
  const battleId = params?.id as string;

  const { data: battle, isPending, error } = useQuery({
    queryKey: topicBattleQueryKeys.detail(battleId),
    queryFn: () => fetchTopicBattle(battleId),
  });

  const quiz = useMemo(() => (battle ? buildDuelQuiz(battle) : null), [battle]);
  const duel = useDuelQuiz(quiz);

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

  return (
    <QuizBattleTemplate
      quiz={quiz}
      state={duel.state}
      timeLeft={duel.timeLeft}
      onSelect={duel.selectAnswer}
      onAdvance={duel.advance}
      onPlayAgain={duel.reset}
      onExit={handleExit}
    />
  );
}

export default TopicBattleDuelPage;
