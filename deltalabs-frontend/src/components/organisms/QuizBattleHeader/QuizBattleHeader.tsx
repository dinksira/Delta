/**
 * QuizBattleHeader — header card for a duel quiz run.
 * Shows the battle title, a PTS badge, a players badge, question progress, and
 * a live countdown timer pill.
 *
 * @example
 * ```tsx
 * <QuizBattleHeader
 *   title="Calculus Showdown"
 *   totalPoints={500}
 *   players={8}
 *   currentQuestion={1}
 *   totalQuestions={5}
 *   timeLeft="03:24"
 * />
 * ```
 */

import { Clock, Swords, Trophy } from "lucide-react";

import { ProgressBar } from "@/components/atoms/ProgressBar";
import { cn } from "@/lib/utils";

export interface QuizBattleHeaderProps {
  title: string;
  totalPoints: number;
  players: number;
  currentQuestion: number;
  totalQuestions: number;
  /** Countdown label such as "03:24" or "0m 45s". */
  timeLeft: string;
  className?: string;
}

export function QuizBattleHeader({
  title,
  totalPoints,
  players,
  currentQuestion,
  totalQuestions,
  timeLeft,
  className,
}: Readonly<QuizBattleHeaderProps>) {
  const progress =
    totalQuestions > 0 ? Math.min(100, Math.round((currentQuestion / totalQuestions) * 100)) : 0;

  return (
    <header
      className={cn(
        "rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <Swords className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-text-primary">{title}</h1>
            <p className="text-xs text-text-secondary">Live Topic Battle</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
            <Trophy className="size-3.5" aria-hidden />
            {totalPoints.toLocaleString()} PTS
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
            <Swords className="size-3.5" aria-hidden />
            {players} players
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-warning-50 px-3 py-1 text-xs font-semibold text-warning-700 dark:bg-warning-900/40 dark:text-warning-300">
            <Clock className="size-3.5" aria-hidden />
            {timeLeft}
          </span>
        </div>
      </div>

      <ProgressBar
        className="mt-4"
        progress={progress}
        label="Progress"
        valueText={`${currentQuestion}/${totalQuestions}`}
      />
    </header>
  );
}

export default QuizBattleHeader;
