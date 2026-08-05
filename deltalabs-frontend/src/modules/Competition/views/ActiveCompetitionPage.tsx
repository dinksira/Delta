"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { TopicBattleListTemplate } from "@/components/templates/TopicBattleListTemplate/TopicBattleListTemplate";
import { JoinTopicBattleModal } from "@/components/organisms/JoinTopicBattleModal";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useTopicBattles } from "@/modules/Competition/hooks/useTopicBattles";
import { useJoinBattleModal } from "@/modules/Competition/hooks/useJoinBattleModal";

const ALL_SUBJECTS = "all";
const ALL_DIFFICULTIES = "all";

export function ActiveCompetitionPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const [searchValue, setSearchValue] = useState("");
  const [activeSubject, setActiveSubject] = useState(ALL_SUBJECTS);
  const [activeFilter, setActiveFilter] = useState(ALL_DIFFICULTIES);

  const query = useTopicBattles();
  const joinModal = useJoinBattleModal();

  const battles = useMemo(() => query.data?.battles ?? [], [query.data]);

  const subjects = useMemo<SubjectPill[]>(() => {
    const counts = new Map<string, number>();
    battles.forEach((battle) => {
      const subject = battle.subject.trim() || "General";
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    });
    return [
      { value: ALL_SUBJECTS, label: "All Subjects", count: battles.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ value: label, label, count })),
    ];
  }, [battles]);

  const filterOptions = useMemo<SearchPillOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchPillOption[] = [{ value: ALL_DIFFICULTIES, label: "All difficulties" }];
    battles.forEach((battle) => {
      const difficulty = battle.difficulty.trim();
      if (difficulty && !seen.has(difficulty)) {
        seen.add(difficulty);
        options.push({ value: difficulty, label: difficulty });
      }
    });
    return options;
  }, [battles]);

  const filteredBattles = useMemo(() => {
    const queryText = searchValue.trim().toLowerCase();
    return battles.filter((battle) => {
      const matchesSearch =
        !queryText ||
        battle.title.toLowerCase().includes(queryText) ||
        battle.subject.toLowerCase().includes(queryText);
      const matchesSubject =
        activeSubject === ALL_SUBJECTS || (battle.subject.trim() || "General") === activeSubject;
      const matchesFilter = activeFilter === ALL_DIFFICULTIES || battle.difficulty === activeFilter;
      return matchesSearch && matchesSubject && matchesFilter;
    });
  }, [battles, searchValue, activeSubject, activeFilter]);

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleUtilityAction = useCallback(() => {
    router.push("/features/competitions/host");
  }, [router]);

  const handleJoinBattle = useCallback(
    (id: string) => {
      const target = battles.find((battle) => battle.id === id);
      if (target) {
        joinModal.openFor(target);
      }
    },
    [battles, joinModal],
  );

  const handleOpenBattle = useCallback(
    (id: string) => {
      router.push(`/features/competitions/battles/${id}`);
    },
    [router],
  );

  const statusSlot = query.isLoading ? (
    <div className="flex items-center justify-center rounded-2xl border border-border-default bg-surface-default p-12 text-text-secondary">
      Loading battles...
    </div>
  ) : query.isError ? (
    <div className="flex items-center justify-center rounded-2xl border border-error-500 bg-error-50 p-6 text-error-700">
      {query.error instanceof Error ? query.error.message : "Failed to load battles"}
    </div>
  ) : null;

  return (
    <>
      <TopicBattleListTemplate
        onBack={handleBack}
        onIntegrate={handleUtilityAction}
        onAutomate={handleUtilityAction}
        onInvite={handleUtilityAction}
        onCopyLink={handleUtilityAction}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeFilter={activeFilter}
        filterOptions={filterOptions}
        onFilterChange={setActiveFilter}
        subjects={subjects}
        activeSubject={activeSubject}
        onSubjectChange={setActiveSubject}
        onCreateNew={handleUtilityAction}
        battles={filteredBattles}
        onJoinBattle={handleJoinBattle}
        onResumeBattle={handleOpenBattle}
        onOpenBattle={handleOpenBattle}
        statusSlot={statusSlot}
      />
      <JoinTopicBattleModal
        open={Boolean(joinModal.battle)}
        battle={joinModal.battle}
        onClose={joinModal.close}
        onConfirm={joinModal.confirm}
        onViewBattle={handleOpenBattle}
        isSubmitting={joinModal.isSubmitting}
        error={joinModal.error}
        success={joinModal.isSuccess}
        isGuest={!isAuthenticated}
      />
    </>
  );
}

export default ActiveCompetitionPage;
