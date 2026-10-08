import type { ComponentProps } from "react";

import { CalendarClock, Lock, LockOpen, Trophy } from "lucide-react";

import { ProgressBar } from "@/components/atoms/ProgressBar";
import type {
  ChampionshipNextSeason,
  ChampionshipSeason,
} from "@/modules/Competition/types/championship";
import { cn } from "@/lib/utils";

export interface ChampionshipSeasonCardProps extends ComponentProps<"section"> {
  season: ChampionshipSeason;
  nextSeason: ChampionshipNextSeason;
}

export function ChampionshipSeasonCard({
  season,
  nextSeason,
  className,
}: Readonly<ChampionshipSeasonCardProps>) {
  const progressPct =
    season.totalPoints > 0 ? Math.round((season.pointsEarned / season.totalPoints) * 100) : 0;
  const stageProgressPct =
    season.totalStages > 0 ? Math.round((season.completedStages / season.totalStages) * 100) : 0;

  return (
    <section
      aria-labelledby="championship-season-heading"
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-secondary-600 text-white">
            <Trophy className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary-600">
              Season {season.number}
            </p>
            <h2
              id="championship-season-heading"
              className="truncate text-xl font-bold text-text-primary"
            >
              {season.title}
            </h2>
          </div>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-xs font-bold",
            season.status === "active"
              ? "bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300"
              : "bg-surface-muted text-text-secondary",
          )}
        >
          {season.status === "active" ? "Active" : "Completed"}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <CalendarClock className="size-4" aria-hidden />
          {formatPeriod(season.startsAt, season.endsAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Trophy className="size-4 text-warning-500" aria-hidden />
          {season.totalPlayers > 0 && season.playerRank > 0
            ? `Rank #${season.playerRank} of ${season.totalPlayers}`
            : "No ranked players yet"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <ProgressBar
          progress={progressPct}
          label="Season points"
          valueText={`${season.pointsEarned.toLocaleString()} / ${season.totalPoints.toLocaleString()} pts`}
        />
        <ProgressBar
          progress={stageProgressPct}
          label="Stages completed"
          valueText={`${season.completedStages} / ${season.totalStages}`}
        />
      </div>

      <div
        className={cn(
          "flex items-center gap-3 rounded-xl border p-3",
          nextSeason.isUnlocked
            ? "border-primary-500/40 bg-primary-50 dark:bg-primary-900/20"
            : "border-border-subtle bg-surface-muted",
        )}
      >
        {nextSeason.isUnlocked ? (
          <LockOpen className="size-5 shrink-0 text-primary-600" aria-hidden />
        ) : (
          <Lock className="size-5 shrink-0 text-text-secondary" aria-hidden />
        )}
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-text-primary">
            {nextSeason.isUnlocked
              ? `Season ${nextSeason.number} · ${nextSeason.title} unlocked`
              : `Season ${nextSeason.number} · ${nextSeason.title} locked`}
          </p>
          <p className="text-text-secondary">{nextSeason.unlockHint}</p>
        </div>
      </div>
    </section>
  );
}

function formatPeriod(startsAt: string, endsAt: string): string {
  const formatDate = (value: string): string => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
    }).format(date);
  };
  return `${formatDate(startsAt)} – ${formatDate(endsAt)}`;
}

export default ChampionshipSeasonCard;
