/**
 * LiveDuelCard — lobby card for a Live Duel competition, mirroring the topic
 * battle card. Shows status (a pulsing LIVE badge while streaming), viewer
 * count, host identity, subject · difficulty, prize pool / entry fee, seat
 * fill progress, and a CTA that moves from Join → Enter Duel after joining.
 *
 * @example
 * ```tsx
 * <LiveDuelCard duel={entry} onJoin={(id) => openFor(id)} />
 * ```
 */

import { Eye } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar";
import { LiveBadge } from "@/components/atoms/LiveBadge";
import { ProgressBar } from "@/components/atoms/ProgressBar/ProgressBar";
import { Button } from "@/components/theme/Button";
import { formatEndsDate } from "@/modules/Competition/utils";
import type { LiveDuelEntry, LiveDuelEntryStatus } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface LiveDuelCardProps {
  duel: LiveDuelEntry;
  onJoin?: (id: string) => void;
  onEnter?: (id: string) => void;
  className?: string;
}

const statusPillClasses: Record<Exclude<LiveDuelEntryStatus, "live">, string> = {
  open: "bg-success-600 text-white",
  scheduled: "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  finished: "bg-surface-muted text-text-secondary",
};

function StatusPill({ duel }: Readonly<{ duel: LiveDuelEntry }>) {
  if (duel.status === "live") {
    return <LiveBadge />;
  }
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        statusPillClasses[duel.status],
      )}
    >
      {duel.status === "open" ? "Open" : duel.status === "scheduled" ? "Starting" : "Finished"}
    </span>
  );
}

export function LiveDuelCard({ duel, onJoin, onEnter, className }: Readonly<LiveDuelCardProps>) {
  const isFinished = duel.status === "finished";
  const isScheduled = duel.status === "scheduled";
  const isFull = duel.playersMax > 0 && duel.playersJoined >= duel.playersMax;
  const progress =
    duel.playersMax > 0
      ? Math.min(100, Math.round((duel.playersJoined / duel.playersMax) * 100))
      : 0;

  return (
    <article
      className={cn(
        "flex flex-col gap-4 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <StatusPill duel={duel} />
          <h3 className="truncate text-base font-bold text-text-primary">{duel.title}</h3>
        </div>
        {duel.viewers > 0 && duel.status !== "scheduled" ? (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-700 px-2.5 py-1 text-xs font-semibold text-white">
            <Eye className="size-3.5" aria-hidden />
            {duel.viewers.toLocaleString()}
          </span>
        ) : null}
      </div>

      <p className="text-sm text-text-secondary">
        {duel.subject} · {duel.difficulty}
        {duel.durationLabel ? <span className="text-text-tertiary"> · {duel.durationLabel}</span> : null}
      </p>

      <div className="flex items-center gap-2.5">
        <Avatar name={duel.hostName} src={duel.hostAvatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-text-primary">{duel.hostName}</p>
          <p className="text-xs text-text-secondary">
            {isScheduled && duel.scheduledAt
              ? `Starts ${formatEndsDate(duel.scheduledAt)}`
              : "Host"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 divide-x divide-border-default rounded-xl bg-surface-muted py-2.5">
        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-base font-bold text-success-600 dark:text-success-400">
            {duel.prizePool}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">Prize Pool</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-2">
          <p className="text-base font-bold text-primary-700 dark:text-primary-300">
            {duel.entryFee}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-text-secondary">Entry Fee</p>
        </div>
      </div>

      <ProgressBar
        progress={progress}
        label="Players"
        valueText={`${duel.playersJoined}/${duel.playersMax}`}
      />

      {isFinished ? (
        <Button variant="primary" disabled className="w-full">
          Duel Over
        </Button>
      ) : isScheduled ? (
        <Button variant="primary" disabled className="w-full">
          Starts Soon
        </Button>
      ) : isFull ? (
        <Button variant="primary" disabled className="w-full">
          Duel Full
        </Button>
      ) : duel.hasJoined ? (
        <Button variant="primary" className="w-full" onClick={() => onEnter?.(duel.id)}>
          Enter Duel
        </Button>
      ) : onJoin ? (
        <Button variant="primary" className="w-full" onClick={() => onJoin(duel.id)}>
          Join Duel
        </Button>
      ) : null}
    </article>
  );
}

export default LiveDuelCard;