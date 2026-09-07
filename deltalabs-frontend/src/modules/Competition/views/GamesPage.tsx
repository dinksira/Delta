"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";

import { GamesPageTemplate } from "@/components/templates/GamesPageTemplate";
import { useGames } from "@/modules/Competition/hooks";
import type { CompetitionGame } from "@/modules/Competition/types/games";

export function GamesPage() {
  const router = useRouter();
  const query = useGames();

  const data = query.data;

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleCreateNew = useCallback(() => {
    router.push("/features/competitions/championship/host");
  }, [router]);

  const handlePlayGame = useCallback(
    (game: CompetitionGame) => {
      if (game.isChampionship) {
        router.push("/features/competitions/championship");
        return;
      }
      router.push(`/features/competitions/games/${game.id}`);
    },
    [router],
  );

  const statusSlot = query.isLoading ? (
    <div className="flex items-center justify-center rounded-2xl border border-border-default bg-surface-default p-12 text-text-secondary">
      Loading games...
    </div>
  ) : query.isError ? (
    <div className="flex items-center justify-center rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
      {query.error instanceof Error ? query.error.message : "Failed to load games"}
    </div>
  ) : null;

  return (
    <GamesPageTemplate
      games={data?.games ?? []}
      onBack={handleBack}
      onPlayGame={handlePlayGame}
      onCreateNew={handleCreateNew}
      statusSlot={statusSlot}
    />
  );
}

export default GamesPage;