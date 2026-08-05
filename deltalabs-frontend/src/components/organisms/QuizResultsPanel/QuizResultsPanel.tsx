/**
 * QuizResultsPanel — post-battle summary card shown when a duel quiz ends.
 * Shows a success/neutral hero, final score, correct count, and rank, plus
 * optional primary and secondary actions.
 *
 * @example
 * ```tsx
 * <QuizResultsPanel
 *   title="Calculus Showdown"
 *   score={1200}
 *   correctCount={4}
 *   total={5}
 *   rank={2}
 *   onPlayAgain={reset}
 *   onExit={exit}
 * />
 * ```
 */

import { CheckCircle2, Hash, Target, Trophy } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";

export interface QuizResultsPanelProps {
  title: string;
  score: number;
  correctCount: number;
  total: number;
  rank: number;
  onPlayAgain?: () => void;
  onExit?: () => void;
  className?: string;
}

export function QuizResultsPanel({
  title,
  score,
  correctCount,
  total,
  rank,
  onPlayAgain,
  onExit,
  className,
}: Readonly<QuizResultsPanelProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-5 rounded-2xl border border-border-default bg-surface-default p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex size-16 items-center justify-center rounded-full bg-success-50">
        <CheckCircle2 className="size-10 text-success-500" aria-hidden />
      </div>

      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Battle Complete
        </p>
        <h2 className="mt-1 text-xl font-bold text-text-primary">{title}</h2>
      </div>

      <div className="flex w-full items-center justify-center gap-6">
        <div className="flex flex-col items-center">
          <Trophy className="size-5 text-primary-600" aria-hidden />
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
            {score.toLocaleString()}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            Points
          </p>
        </div>
        <div className="h-12 w-px bg-border-default" aria-hidden />
        <div className="flex flex-col items-center">
          <Target className="size-5 text-success-600" aria-hidden />
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">
            {correctCount}/{total}
          </p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            Correct
          </p>
        </div>
        <div className="h-12 w-px bg-border-default" aria-hidden />
        <div className="flex flex-col items-center">
          <Hash className="size-5 text-info-600" aria-hidden />
          <p className="mt-1 text-2xl font-bold tabular-nums text-text-primary">#{rank}</p>
          <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
            Rank
          </p>
        </div>
      </div>

      <div className="mt-1 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-center">
        <Button variant="ghost" onClick={onExit}>
          Back to Battles
        </Button>
        {onPlayAgain && (
          <Button variant="primary" onClick={onPlayAgain}>
            Play Again
          </Button>
        )}
      </div>
    </div>
  );
}

export default QuizResultsPanel;
