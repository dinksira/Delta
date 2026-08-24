"use client";

import { useCallback, useState } from "react";

import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  CalendarClock,
  Gift,
  ListChecks,
  Settings,
  Swords,
  Ticket,
  Timer,
  Trophy,
  Users,
} from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { fetchTopicBattle } from "@/modules/Competition/api";
import { topicBattleQueryKeys } from "@/modules/Competition/hooks/topicBattleQueryKeys";
import { useJoinTopicBattle } from "@/modules/Competition/hooks/useJoinTopicBattle";
import {
  formatEndsDate,
  getFormatLabel,
  getPrizeRuleLabel,
  getStatusLabel,
  getTimingLabel,
  getVisibilityLabel,
} from "@/modules/Competition/utils";

interface InfoCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
}

function InfoCard({ icon: Icon, label, value }: Readonly<InfoCardProps>) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default p-4">
      <Icon className="size-5 shrink-0 text-primary-500" aria-hidden />
      <div className="min-w-0">
        <Typography variant="small" className="text-text-secondary">
          {label}
        </Typography>
        <Typography className="truncate font-medium">{value}</Typography>
      </div>
    </div>
  );
}

export function CompetitionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const battleId = params?.id as string;

  const { data: battle, isPending, error } = useQuery({
    queryKey: topicBattleQueryKeys.detail(battleId),
    queryFn: () => fetchTopicBattle(battleId),
  });

  const joinMutation = useJoinTopicBattle();
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleJoin = useCallback(() => {
    if (!battle) {
      return;
    }
    setJoinError(null);
    joinMutation.mutate(battle.id, {
      onError: (joinErr) => {
        setJoinError(
          joinErr instanceof Error ? joinErr.message : "Failed to join this competition",
        );
      },
    });
  }, [battle, joinMutation]);

  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-text-secondary">
        Loading competition...
      </div>
    );
  }

  if (error || !battle) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-6">
        <Typography className="text-text-secondary">
          {error instanceof Error && error.message.includes("404")
            ? "Competition not found"
            : "Failed to load this competition"}
        </Typography>
        <Button variant="secondary" size="sm" onClick={() => router.push("/features/competitions/list")}>
          Browse competitions
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 overflow-y-auto p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Typography as="h1" className="truncate text-2xl font-semibold text-primary-600">
          {battle.title}
        </Typography>
      </div>

      {/* Hero banner */}
      <div className="relative flex min-h-48 items-end overflow-hidden rounded-2xl bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 flex w-full items-start justify-between gap-4 p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 shrink-0 text-yellow-400" aria-hidden />
              <Typography as="h2" className="text-3xl font-bold text-white">
                {battle.title}
              </Typography>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                {battle.subject}
              </span>
              <span className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white">
                {battle.difficulty}
              </span>
              <span className="inline-flex rounded-full bg-success-100 px-2.5 py-0.5 text-xs font-medium text-success-700 dark:bg-success-900/40 dark:text-success-300">
                {getStatusLabel(battle.status)}
              </span>
            </div>
          </div>
          <span className="hidden shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-medium text-white sm:inline-flex">
            Hosted by {battle.creator.name}
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard icon={Gift} label="Prize pool" value={battle.prizePool} />
        <InfoCard icon={Ticket} label="Entry fee" value={battle.entryFee} />
        <InfoCard
          icon={Users}
          label="Players"
          value={`${battle.playersJoined}/${battle.playersMax}`}
        />
        <InfoCard
          icon={CalendarClock}
          label="Ends"
          value={formatEndsDate(battle.countdownEndsAt)}
        />
        <InfoCard
          icon={BookOpen}
          label="Subject"
          value={battle.subject}
        />
        <InfoCard
          icon={ListChecks}
          label="Questions"
          value={battle.questions.length}
        />
        <InfoCard
          icon={Swords}
          label="Format"
          value={getFormatLabel(battle.format)}
        />
        <InfoCard
          icon={Timer}
          label="Duration"
          value={`${battle.durationMinutes} min round`}
        />
        <InfoCard
          icon={Trophy}
          label="Prize rule"
          value={getPrizeRuleLabel(battle.prizeRule)}
        />
        <InfoCard
          icon={Users}
          label="Visibility"
          value={`${getVisibilityLabel(battle.visibility)} · ${getTimingLabel(battle.timing)}`}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        {battle.isOwner ? (
          <span className="inline-flex items-center gap-2 rounded-xl border border-border-default bg-surface-muted px-4 py-2.5 text-sm font-medium text-text-secondary">
            <Settings className="size-4" aria-hidden />
            You host this battle — manage & track it from here
          </span>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={handleJoin}
            disabled={joinMutation.isPending || battle.hasJoined}
          >
            {joinMutation.isPending
              ? "Joining..."
              : battle.hasJoined
                ? "Joined"
                : "Join Competition"}
          </Button>
        )}
        <Button
          variant="secondary"
          size="lg"
          onClick={() => router.push("/features/competitions/list")}
        >
          Browse Competitions
        </Button>
      </div>

      {joinError ? (
        <div className="rounded-xl border border-error-500 bg-error-50 px-4 py-3 text-sm text-error-700">
          {joinError}
        </div>
      ) : null}
    </div>
  );
}

export default CompetitionDetailPage;
