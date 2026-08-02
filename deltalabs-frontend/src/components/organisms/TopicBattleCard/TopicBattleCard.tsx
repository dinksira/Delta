import { useEffect, useState } from "react";

import { Clock } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { ProgressBar } from "@/components/atoms/ProgressBar/ProgressBar";
import {
  getInitials,
  getStatusBadgeClass,
  getStatusLabel,
} from "@/modules/Competition/utils";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { cn } from "@/lib/utils";

export interface TopicBattleCardProps {
  battle: TopicBattle;
  onJoin?: (id: string) => void;
  onOpen?: (id: string) => void;
  className?: string;
}

function formatCountdown(target: string | null): string | null {
  if (!target) {
    return null;
  }
  const end = new Date(target).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  const totalSeconds = Math.max(0, Math.ceil((end - Date.now()) / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
}

function useCountdown(target: string | null): string | null {
  const [label, setLabel] = useState<string | null>(() => formatCountdown(target));

  useEffect(() => {
    setLabel(formatCountdown(target));
    const timer = setInterval(() => {
      setLabel(formatCountdown(target));
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return label;
}

function StatusTimer({ battle }: Readonly<{ battle: TopicBattle }>) {
  const countdown = useCountdown(battle.countdownEndsAt);
  const status = battle.status.toLowerCase();

  if (status === "finished") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
        <Clock className="size-3.5" aria-hidden />
        Ended
      </span>
    );
  }

  if (status === "live") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
        <Clock className="size-3.5" aria-hidden />
        Live now
      </span>
    );
  }

  if (status === "scheduled") {
    return (
      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
        <Clock className="size-3.5" aria-hidden />
        Starting soon
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-800 px-2.5 py-1 text-xs font-semibold text-white">
      <Clock className="size-3.5" aria-hidden />
      {countdown ?? "0m 00s"}
    </span>
  );
}

export function TopicBattleCard({
  battle,
  onJoin,
  onOpen,
  className,
}: Readonly<TopicBattleCardProps>) {
  const isFinished = battle.status.toLowerCase() === "finished";
  const isFull = battle.playersMax > 0 && battle.playersJoined >= battle.playersMax;
  const creatorName = battle.isOwner ? "You" : battle.creator.name;
  const progress =
    battle.playersMax > 0
      ? Math.min(100, Math.round((battle.playersJoined / battle.playersMax) * 100))
      : 0;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {/* Status header: badge + title on the left, countdown timer on the right */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span
            className={cn(
              "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
              getStatusBadgeClass(battle.status),
            )}
          >
            {getStatusLabel(battle.status)}
          </span>
          <h3 className="truncate text-base font-bold text-text-primary">{battle.title}</h3>
        </div>
        <StatusTimer battle={battle} />
      </div>

      {/* Subject · difficulty subtitle */}
      <p className="text-sm text-text-secondary">
        {battle.subject} · {battle.difficulty}
      </p>

      {/* Creator */}
      <div className="flex items-center gap-2.5">
        <span
          className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-700 text-sm font-semibold text-white"
          aria-hidden
        >
          {getInitials(creatorName)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{creatorName}</p>
          <p className="text-xs text-text-secondary">{battle.isOwner ? "You host this" : "Creator"}</p>
        </div>
      </div>

      {/* Economics: prize pool + entry fee */}
      <div className="grid grid-cols-2 divide-x divide-border-default rounded-xl bg-surface-muted py-2.5">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-base font-bold text-success-600 dark:text-success-400">
            {battle.prizePool}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">Prize Pool</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-base font-bold text-primary-700 dark:text-primary-300">
            {battle.entryFee}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">Entry Fee</p>
        </div>
      </div>

      {/* Players progress */}
      <ProgressBar
        progress={progress}
        label="Players"
        valueText={`${battle.playersJoined}/${battle.playersMax}`}
      />

      {/* Primary CTA */}
      {isFinished ? (
        <Button variant="primary" disabled className="w-full">
          Battle Over
        </Button>
      ) : battle.isOwner ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => onOpen?.(battle.id)}
        >
          Manage & Track
        </Button>
      ) : isFull ? (
        <Button variant="primary" disabled className="w-full">
          Battle Full
        </Button>
      ) : onJoin ? (
        <Button
          variant="primary"
          className="w-full"
          onClick={() => onJoin(battle.id)}
          disabled={battle.hasJoined}
        >
          {battle.hasJoined ? "Joined" : "Join Battle"}
        </Button>
      ) : null}
    </article>
  );
}

export default TopicBattleCard;
