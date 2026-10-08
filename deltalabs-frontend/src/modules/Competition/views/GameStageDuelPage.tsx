/**
 * GameStageDuelPage — unlocked game-stage duel for a single stage of a game
 * ladder. Reads the stage (by route ids) from the Games lobby, launches its
 * real seeded battle through the shared duel quiz engine, and on finish
 * completes the stage so the payout (points + ETB prize) is credited and the
 * next stage unlocks.
 *
 * @example
 * ```tsx
 * <GameStageDuelPage />
 * ```
 */

"use client";

import { useEffect, useMemo, useRef } from "react";

import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Coins, Gamepad2, Loader2 } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { QuizBattleTemplate } from "@/components/templates/QuizBattleTemplate";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchTopicBattle } from "@/modules/Competition/api";
import { buildDuelQuiz } from "@/modules/Competition/data";
import {
  topicBattleQueryKeys,
  useCompleteGameStage,
  useDuelQuiz,
  useGames,
  useTopicBattleLeaderboard,
} from "@/modules/Competition/hooks";

export function GameStageDuelPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = typeof params?.id === "string" ? params.id : "";
  const stageId = typeof params?.stageId === "string" ? params.stageId : "";
  const { isAuthenticated, session } = useAuthSession();
  const currentUserId = session?.user?.id ?? null;
  const queryClient = useQueryClient();

  const gamesQuery = useGames();
  const completeStage = useCompleteGameStage();

  const stage = useMemo(
    () =>
      gamesQuery.data?.games
        .find((entry) => entry.id === gameId)
        ?.stages.find((s) => s.id === stageId) ?? null,
    [gamesQuery.data, gameId, stageId],
  );
  const battleId = stage?.battleId;

  const {
    data: battle,
    isPending,
    error,
  } = useQuery({
    queryKey: topicBattleQueryKeys.detail(battleId ?? "missing"),
    queryFn: () => fetchTopicBattle(battleId as string),
    enabled: Boolean(battleId),
  });

  const { entries: leaderboardEntries } = useTopicBattleLeaderboard(battleId, currentUserId);
  const quiz = useMemo(
    () => (battle ? buildDuelQuiz(battle, leaderboardEntries) : null),
    [battle, leaderboardEntries],
  );
  const durationSeconds = battle?.durationMinutes ? battle.durationMinutes * 60 : undefined;
  const duel = useDuelQuiz(quiz, durationSeconds);

  const finished =
    Boolean(quiz) &&
    duel.state.totalQuestions > 0 &&
    duel.state.currentQuestionIndex >= duel.state.totalQuestions;
  const completionSent = useRef(false);
  useEffect(() => {
    if (finished && stage && isAuthenticated && !completionSent.current) {
      completionSent.current = true;
      completeStage.mutate({ gameId, stageOrder: stage.order });
    }
  }, [finished, stage, isAuthenticated, completeStage, gameId]);

  const handleBackToGame = () => {
    queryClient.removeQueries({ queryKey: topicBattleQueryKeys.detail(battleId ?? "") });
    router.push(`/features/competitions/games/${gameId}`);
  };

  const handleBack = () => {
    router.push(`/features/competitions/games/${gameId}`);
  };

  if (gamesQuery.isPending) {
    return <LoadingNotice label="Opening the game..." />;
  }

  if (!stage) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-text-secondary">This stage does not exist in this game.</p>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Back to Game
        </Button>
      </div>
    );
  }

  if (isPending) {
    return <LoadingNotice label={`Loading ${stage.name}...`} />;
  }

  if (error || !battle || !quiz) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <p className="text-text-secondary">Failed to load this stage challenge.</p>
        <Button variant="secondary" size="sm" onClick={handleBack}>
          <ArrowLeft className="size-4" />
          Back to Game
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b border-border-default bg-surface-default px-4 py-3 md:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <Gamepad2 className="size-5 shrink-0 text-secondary-600" aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">
              {stage.name} · {stage.shortLabel}
            </p>
            <p className="truncate text-xs text-text-secondary">
              {stage.pointsToEarn} pts at stake · Prize {stage.prizePool}
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700">
          <Coins className="size-3.5" aria-hidden />
          {stage.prizePool}
        </span>
      </div>
      <QuizBattleTemplate
        quiz={quiz}
        state={duel.state}
        timeLeft={duel.timeLeft}
        timeLeftSeconds={duel.timeLeftSeconds}
        timeTotalSeconds={duel.totalTimeSeconds}
        onSubmit={duel.submitAnswer}
        onAdvance={duel.advance}
        onPlayAgain={handleBackToGame}
        onExit={handleBackToGame}
      />
    </div>
  );
}

function LoadingNotice({ label }: Readonly<{ label: string }>) {
  return (
    <div className="flex h-full items-center justify-center gap-2 p-6 text-text-secondary">
      <Loader2 className="size-5 animate-spin" aria-hidden />
      {label}
    </div>
  );
}

export default GameStageDuelPage;
