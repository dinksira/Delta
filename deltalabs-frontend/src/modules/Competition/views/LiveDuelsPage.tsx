/**
 * LiveDuelsPage
 * Lobby for Live Duel competitions, mirroring the topic battle lobby: search,
 * difficulty filter, subject pills, live-duel cards, and the identical join
 * confirmation → success → "Enter Duel" flow before dropping into the room. A
 * "Create Live Duel" action routes to the host setup page; session-created
 * duels appear at the top of the list. A "Past duels" section replays finished
 * rooms from the backend history with their snapshot final leaderboards.
 *
 * @example
 * ```tsx
 * <LiveDuelsPage />
 * ```
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { useRouter } from "next/navigation";
import { Radio } from "lucide-react";

import { LiveDuelsListTemplate } from "@/components/templates/LiveDuelsListTemplate";
import { JoinLiveDuelModal } from "@/components/organisms/JoinLiveDuelModal";
import { LiveDuelGrid } from "@/components/organisms/LiveDuelGrid/LiveDuelGrid";
import { Typography } from "@/components/theme/Typography";
import type { SearchPillOption } from "@/components/molecules/SearchPill/SearchPill";
import type { SubjectPill } from "@/components/molecules/SubjectPills/SubjectPills";
import { Button } from "@/components/theme/Button";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchLiveDuels, fetchLiveDuelHistory } from "@/modules/Competition/api";
import type { LiveDuelHistoryEntry } from "@/modules/Competition/types/liveDuel";
import { useJoinLiveDuelModal } from "@/modules/Competition/hooks/useJoinLiveDuelModal";
import {
  getLiveDuelsCatalog,
  upsertLiveDuelEntry,
} from "@/modules/Competition/data/liveDuelsCatalog";

const ALL_SUBJECTS = "all";
const ALL_DIFFICULTIES = "all";

export function LiveDuelsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthSession();
  const [searchValue, setSearchValue] = useState("");
  const [activeSubject, setActiveSubject] = useState(ALL_SUBJECTS);
  const [activeFilter, setActiveFilter] = useState(ALL_DIFFICULTIES);
  // Bump so the memos re-read the registry once the backend catalog arrives.
  const [remoteVersion, setRemoteVersion] = useState(0);
  const [historyEntries, setHistoryEntries] = useState<LiveDuelHistoryEntry[]>([]);

  // Finished rooms with their snapshot final leaderboards (replay surface).
  useEffect(() => {
    let active = true;
    fetchLiveDuelHistory()
      .then((history) => {
        if (active) {
          setHistoryEntries(history);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Merge the backend catalog into the local registry (deduped by id) so any
  // room a user navigates to resolves — even ones hosted by other sessions.
  // Re-run after a join so the server's persisted hasJoined flips the card.
  const refreshList = useCallback(() => {
    let active = true;
    fetchLiveDuels()
      .then((list) => {
        if (!active) {
          return;
        }
        list.forEach((entry) => upsertLiveDuelEntry(entry));
        setRemoteVersion((version) => version + 1);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => refreshList(), [refreshList]);

  const catalog = useMemo(() => {
    void remoteVersion;
    return getLiveDuelsCatalog();
  }, [remoteVersion]);
  const joinModal = useJoinLiveDuelModal();

  // Re-merge the backend catalog once a join succeeds so the server's persisted
  // hasJoined flips that duel's card from "Join Duel" to "Enter Duel".
  useEffect(() => {
    if (joinModal.isSuccess) {
      refreshList();
    }
  }, [joinModal.isSuccess, refreshList]);

  const subjects = useMemo<SubjectPill[]>(() => {
    const counts = new Map<string, number>();
    catalog.forEach((duel) => {
      const subject = duel.subject.trim() || "General";
      counts.set(subject, (counts.get(subject) ?? 0) + 1);
    });
    return [
      { value: ALL_SUBJECTS, label: "All Subjects", count: catalog.length },
      ...[...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([label, count]) => ({ value: label, label, count })),
    ];
  }, [catalog]);

  const filterOptions = useMemo<SearchPillOption[]>(() => {
    const seen = new Set<string>();
    const options: SearchPillOption[] = [{ value: ALL_DIFFICULTIES, label: "All difficulties" }];
    catalog.forEach((duel) => {
      const difficulty = duel.difficulty.trim();
      if (difficulty && !seen.has(difficulty)) {
        seen.add(difficulty);
        options.push({ value: difficulty, label: difficulty });
      }
    });
    return options;
  }, [catalog]);

  const filteredDuels = useMemo(() => {
    const queryText = searchValue.trim().toLowerCase();
    return catalog.filter((duel) => {
      const matchesSearch =
        !queryText ||
        duel.title.toLowerCase().includes(queryText) ||
        duel.subject.toLowerCase().includes(queryText) ||
        duel.hostName.toLowerCase().includes(queryText);
      const matchesSubject =
        activeSubject === ALL_SUBJECTS || (duel.subject.trim() || "General") === activeSubject;
      const matchesFilter = activeFilter === ALL_DIFFICULTIES || duel.difficulty === activeFilter;
      return matchesSearch && matchesSubject && matchesFilter;
    });
  }, [catalog, searchValue, activeSubject, activeFilter]);

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleCreateDuel = useCallback(() => {
    router.push("/features/competitions/live-duels/create");
  }, [router]);

  const handleJoinDuel = useCallback(
    (id: string) => {
      const target = catalog.find((duel) => duel.id === id);
      if (target) {
        joinModal.openFor(target);
      }
    },
    [catalog, joinModal],
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
        actionsSlot={
          <Button variant="primary" onClick={handleCreateDuel}>
            <Radio className="size-4" aria-hidden />
            Create Live Duel
          </Button>
        }
        footerSlot={
          historyEntries.length > 0 ? (
            <section aria-labelledby="past-live-duels-heading">
              <div className="mb-3 flex items-center justify-between gap-3">
                <Typography
                  as="h2"
                  id="past-live-duels-heading"
                  className="text-lg font-semibold text-text-primary"
                >
                  Past duels
                </Typography>
                <span className="text-sm tabular-nums text-text-secondary">
                  {historyEntries.length} finished
                </span>
              </div>
              <LiveDuelGrid
                duels={historyEntries}
                onEnter={handleEnterDuel}
                emptyTitle="No finished duels yet"
                emptyDescription="Replay finished live duels here with their final leaderboards."
              />
            </section>
          ) : undefined
        }
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
