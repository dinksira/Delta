/**
 * LiveDuelsPage
 * Lobby for Live Duel competitions, mirroring the topic battle lobby: search,
 * difficulty filter, subject pills, live-duel cards, and the identical join
 * confirmation → success → "Enter Duel" flow before dropping into the room.
 *
 * @example
 * ```tsx
 * <LiveDuelsPage />
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import { useRouter } from "next/navigation";

import { LiveDuelsListTemplate } from "@/components/templates/LiveDuelsListTemplate";
import { JoinLiveDuelModal } from "@/components/organisms/JoinLiveDuelModal";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useJoinLiveDuelModal } from "@/modules/Competition/hooks/useJoinLiveDuelModal";
import { DEMO_LIVE_DUELS } from "@/modules/Competition/data/liveDuelsCatalog";

const ALL_SUBJECTS = "all";
const ALL_DIFFICULTIES = "all";

export function LiveDuelsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const [searchValue, setSearchValue] = useState("");
  const [activeSubject, setActiveSubject] = useState(ALL_SUBJECTS);
  const [activeFilter, setActiveFilter] = useState(ALL_DIFFICULTIES);

  const joinModal = useJoinLiveDuelModal();

  const subjects = useMemo<SubjectPill[]>(() => {
    const counts = new Map<string, number>();
    DEMO_LIVE_DUELS.forEach((duel) => {
      const subject = duel.subject.trim() || "General";
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    });
    return [
      { value: ALL_SUBJECTS, label: "All Subjects", count: DEMO_LIVE_DUELS.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ value: label, label, count })),
    ];
  }, []);

  const filterOptions = useMemo<SearchPillOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchPillOption[] = [{ value: ALL_DIFFICULTIES, label: "All difficulties" }];
    DEMO_LIVE_DUELS.forEach((duel) => {
      const difficulty = duel.difficulty.trim();
      if (difficulty && !seen.has(difficulty)) {
        seen.add(difficulty);
        options.push({ value: difficulty, label: difficulty });
      }
    });
    return options;
  }, []);

  const filteredDuels = useMemo(() => {
    const queryText = searchValue.trim().toLowerCase();
    return DEMO_LIVE_DUELS.filter((duel) => {
      const matchesSearch =
        !queryText ||
        duel.title.toLowerCase().includes(queryText) ||
        duel.subject.toLowerCase().includes(queryText) ||
        duel.hostName.toLowerCase().includes(queryText);
      const matchesSubject =
        activeSubject === ALL_SUBJECTS || (duel.subject.trim() || "General") === activeSubject;
      const matchesFilter =
        activeFilter === ALL_DIFFICULTIES || duel.difficulty === activeFilter;
      return matchesSearch && matchesSubject && matchesFilter;
    });
  }, [searchValue, activeSubject, activeFilter]);

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleJoinDuel = useCallback(
    (id: string) => {
      const target = DEMO_LIVE_DUELS.find((duel) => duel.id === id);
      if (target) {
        joinModal.openFor(target);
      }
    },
    [joinModal],
  );

  const handleEnterDuel = useCallback(
    (id: string) => {
      router.push(`/features/competitions/live-duels/${id}`);
    },
    [router],
  );

  return (
    <>
      <LiveDuelsListTemplate
        onBack={handleBack}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        activeFilter={activeFilter}
        filterOptions={filterOptions}
        onFilterChange={setActiveFilter}
        subjects={subjects}
        activeSubject={activeSubject}
        onSubjectChange={setActiveSubject}
        duels={filteredDuels}
        onJoinDuel={handleJoinDuel}
        onEnterDuel={handleEnterDuel}
      />
      <JoinLiveDuelModal
        open={Boolean(joinModal.duel)}
        duel={joinModal.duel}
        onClose={joinModal.close}
        onConfirm={joinModal.confirm}
        onEnterDuel={handleEnterDuel}
        isSubmitting={joinModal.isSubmitting}
        error={joinModal.error}
        success={joinModal.isSuccess}
        isGuest={!isAuthenticated}
      />
    </>
  );
}

export default LiveDuelsPage;