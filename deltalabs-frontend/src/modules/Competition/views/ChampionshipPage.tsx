"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { ChampionshipPageTemplate } from "@/components/templates/ChampionshipPageTemplate";
import { ChampionshipStageConfirmModal } from "@/components/organisms/ChampionshipStageConfirmModal";
import { useChampionship } from "@/modules/Competition/hooks/useChampionship";
import type { ChampionshipStage } from "@/modules/Competition/types/championship";
import type { DuelLeaderboardEntry } from "@/modules/Competition/types/duelQuiz";

const EMPTY_STANDINGS: DuelLeaderboardEntry[] = [];

export function ChampionshipPage() {
  const router = useRouter();
  const query = useChampionship();
  const [selectedStage, setSelectedStage] = useState<ChampionshipStage | null>(null);

  const data = query.data;

  const handleBack = useCallback(() => {
    router.push("/features/competitions/games");
  }, [router]);

  const handleUtilityAction = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleCreateNew = useCallback(() => {
    router.push("/features/competitions/championship/host");
  }, [router]);

  const handlePlayStage = useCallback((stage: ChampionshipStage) => {
    if (stage.status !== "unlocked") {
      return;
    }
    setSelectedStage(stage);
  }, []);

  const handleConfirmStage = useCallback(
    (stage: ChampionshipStage) => {
      setSelectedStage(null);
      router.push(`/features/competitions/championship/stages/${stage.id}`);
    },
    [router],
  );

  const standings: DuelLeaderboardEntry[] = (data?.standings ?? []).map((entry) => ({
    rank: entry.rank,
    name: entry.name,
    avatarUrl: entry.avatarUrl,
    points: entry.points,
    isCurrentUser: entry.isCurrentUser,
  }));

  const statusSlot = query.isLoading ? (
    <div className="flex items-center justify-center rounded-2xl border border-border-default bg-surface-default p-12 text-text-secondary">
      Loading championship...
    </div>
  ) : query.isError ? (
    <div className="flex items-center justify-center rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
      {query.error instanceof Error ? query.error.message : "Failed to load the championship"}
    </div>
  ) : null;

  return (
    <>
      <ChampionshipPageTemplate
        onBack={handleBack}
        onIntegrate={handleUtilityAction}
        onAutomate={handleUtilityAction}
        onInvite={handleUtilityAction}
        onCopyLink={handleUtilityAction}
        onCreateNew={handleCreateNew}
        season={data?.season ?? null}
        nextSeason={data?.nextSeason ?? null}
        stages={data?.stages ?? []}
        standings={standings.length > 0 ? standings : EMPTY_STANDINGS}
        onPlayStage={handlePlayStage}
        statusSlot={statusSlot}
      />
      <ChampionshipStageConfirmModal
        open={Boolean(selectedStage)}
        stage={selectedStage}
        onClose={() => setSelectedStage(null)}
        onConfirm={handleConfirmStage}
      />
    </>
  );
}

export default ChampionshipPage;