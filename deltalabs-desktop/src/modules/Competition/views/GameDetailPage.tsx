/**
 * GameDetailPage — the unlock-ladder detail for a single (non-championship)
 * game. Reads the game from the Games lobby, renders its staged ladder
 * ("Warm-up" → "Seeded Round" → "Winner's Round"), and gates each play behind
 * the monetized confirm modal before pushing into the stage duel route.
 *
 * @example
 * ```tsx
 * <GameDetailPage />
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Coins, Loader2, Star, Target } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { ChampionshipStageConfirmModal } from "@/components/organisms/ChampionshipStageConfirmModal";
import { ChampionshipStageCard } from "@/components/molecules/ChampionshipStageCard";
import { useGames } from "@/modules/Competition/hooks";
import type { GameStage } from "@/modules/Competition/types/games";

export function GameDetailPage() {
  const params = useParams();
  const router = useRouter();
  const gameId = typeof params?.id === "string" ? params.id : "";
  const [selectedStage, setSelectedStage] = useState<GameStage | null>(null);

  const query = useGames();

  const game = useMemo(
    () => query.data?.games.find((entry) => entry.id === gameId) ?? null,
    [query.data, gameId],
  );

  const handleBack = useCallback(() => {
    router.push("/features/competitions/games");
  }, [router]);

  const handlePlayStage = useCallback((stage: GameStage) => {
    if (stage.status !== "unlocked") {
      return;
    }
    setSelectedStage(stage);
  }, []);

  const handleConfirmStage = useCallback(
    (stage: GameStage) => {
      setSelectedStage(null);
      router.push(`/features/competitions/games/${gameId}/stages/${stage.id}`);
    },
    [router, gameId],
  );

  const pointsAvailable = useMemo(
    () => (game?.stages ?? []).reduce<number>((sum, stage) => sum + stage.pointsToEarn, 0),
    [game?.stages],
  );
  const pointsCollected = useMemo(
    () => (game?.stages ?? []).reduce<number>((sum, stage) => sum + stage.pointsEarned, 0),
    [game?.stages],
  );

  if (game?.isChampionship) {
    router.replace("/features/competitions/championship");
    return null;
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <header className="flex items-center gap-3 border-b border-border-default bg-surface-default px-4 py-3 md:px-6">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="size-4" />
            Back
          </Button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-text-primary">
              {query.isLoading ? "Loading game..." : game?.title ?? "Game"}
            </h1>
            <p className="truncate text-xs text-text-secondary">
              {game
                ? `${game.genre} · ${game.difficulty}`
                : query.isLoading
                  ? "Fetching the ladder..."
                  : "Game not found"}
            </p>
          </div>
          {game ? (
            <div className="flex shrink-0 items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full bg-info-50 px-3 py-1 text-xs font-bold text-info-700">
                <Star className="size-3.5" aria-hidden />
                {pointsCollected}/{pointsAvailable} pts
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-success-50 px-3 py-1 text-xs font-bold text-success-700">
                <Coins className="size-3.5" aria-hidden />
                ETB {game.stages.reduce<number>((sum, s) => sum + (Number(s.prizePool.replace(/\D/g, "")) || 0), 0)}
              </span>
            </div>
          ) : null}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {game ? (
            <p className="mb-5 max-w-3xl text-sm leading-relaxed text-text-secondary">
              {game.description} Win the Warm-up Round to unlock the Seeded Round — every stage
              you win pays out points and an ETB prize.
            </p>
          ) : null}

          {query.isLoading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-text-secondary">
              <Loader2 className="size-5 animate-spin" aria-hidden />
              Loading stages...
            </div>
          ) : query.isError ? (
            <div className="rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
              {query.error instanceof Error ? query.error.message : "Failed to load the game"}
            </div>
          ) : (game?.stages ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
              <Target className="size-8 text-text-tertiary" aria-hidden />
              <p className="text-sm text-text-secondary">
                No stages unlocked yet — keep an eye out for the next event.
              </p>
            </div>
          ) : (
            <div className="grid max-w-3xl gap-3">
              {(game?.stages ?? []).map((stage) => (
                <ChampionshipStageCard key={stage.id} stage={stage} onPlay={handlePlayStage} />
              ))}
            </div>
          )}
        </div>
      </div>

      <ChampionshipStageConfirmModal
        open={Boolean(selectedStage)}
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
        onConfirm={handleConfirmStage}
      />
    </>
  );
}

export default GameDetailPage;