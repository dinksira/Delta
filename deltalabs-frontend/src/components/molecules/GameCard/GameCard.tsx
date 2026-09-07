import type { ComponentProps } from "react";

import { Clock, Lock, Play, Trophy, Users } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import type { CompetitionGame } from "@/modules/Competition/types/games";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<string, string> = {
  primary: "bg-primary-50 text-primary-600",
  slate: "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
  orange: "bg-[color:var(--color-features-chip-orange-bg)] text-[color:var(--color-features-chip-orange-fg)]",
  indigo: "bg-[color:var(--color-features-chip-indigo-bg)] text-[color:var(--color-features-chip-indigo-fg)]",
  emerald: "bg-[color:var(--color-features-chip-emerald-bg)] text-[color:var(--color-features-chip-emerald-fg)]",
  amber: "bg-[color:var(--color-features-chip-amber-bg)] text-[color:var(--color-features-chip-amber-fg)]",
  rose: "bg-[color:var(--color-features-chip-rose-bg)] text-[color:var(--color-features-chip-rose-fg)]",
  cyan: "bg-[color:var(--color-features-chip-cyan-bg)] text-[color:var(--color-features-chip-cyan-fg)]",
  teal: "bg-[color:var(--color-features-chip-teal-bg)] text-[color:var(--color-features-chip-teal-fg)]",
  violet: "bg-[color:var(--color-features-chip-violet-bg)] text-[color:var(--color-features-chip-violet-fg)]",
  fuchsia: "bg-[color:var(--color-features-chip-fuchsia-bg)] text-[color:var(--color-features-chip-fuchsia-fg)]",
};

export interface GameCardProps extends Omit<ComponentProps<"div">, "onPlay"> {
  game: CompetitionGame;
  onPlay?: (game: CompetitionGame) => void;
}

export function GameCard({ game, onPlay, className, ...rest }: GameCardProps) {
  const isOpen = game.status === "open";
  const isLocked = game.status === "locked";
  const isComingSoon = game.status === "coming-soon";

  return (
    <div
      {...rest}
      className={cn(
        "group flex flex-col gap-3 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm",
        "transition-colors duration-150 hover:border-primary-300",
        className,
      )}
    >
      {/* Genre pill + status marker */}
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
            TONE_CLASSES[game.tone] ?? TONE_CLASSES.primary,
          )}
        >
          {game.isChampionship && <Trophy className="size-3.5" />}
          {game.genre}
        </span>
        {game.isChampionship && !isComingSoon && (
          <span className="inline-flex items-center gap-1 rounded-full bg-warning-50 px-2.5 py-1 text-xs font-semibold text-warning-700">
            <Clock className="size-3.5" />
            Tournament
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        <Typography as="h3" className="text-base font-semibold text-text-primary">
          {game.title}
        </Typography>
        <p className="mt-1 text-sm leading-5 text-text-secondary line-clamp-2">
          {game.description}
        </p>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-text-tertiary">
        <span className="inline-flex items-center gap-1.5 font-medium text-success-700">
          +{game.pointsToEarn} pts
        </span>
        {game.playersMax != null && game.playersMax > 0 && (
          <span className="inline-flex items-center gap-1.5 tabular-nums">
            <Users className="size-4" />
            {game.playersCount}/{game.playersMax}
          </span>
        )}
        <span>{game.difficulty}</span>
      </div>

      {/* CTA / state slot */}
      <div className="mt-auto">
        {isOpen && onPlay ? (
          <Button type="button" variant="primary" size="sm" className="w-full" onClick={() => onPlay(game)}>
            <Play className="size-4" />
            {game.isChampionship ? "Play tournament" : "Play now"}
          </Button>
        ) : isLocked ? (
          <div className="flex items-center gap-2 rounded-lg border border-border-default bg-surface-muted px-3 py-2 text-xs text-text-secondary">
            <Lock className="size-4 shrink-0 text-text-tertiary" />
            {game.unlockHint ?? "Locked"}
          </div>
        ) : (
          <span className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border-default bg-surface-muted px-3 py-2 text-xs font-medium text-text-tertiary">
            Coming soon
          </span>
        )}
      </div>
    </div>
  );
}

export default GameCard;