/**
 * QuizMetricsRow — the SCORE / RANK / CORRECT stats strip for a duel quiz.
 * Composes three `MetricTile`s from the live duel state.
 *
 * @example
 * ```tsx
 * <QuizMetricsRow score={1200} rank={2} correctCount={4} total={5} />
 * ```
 */

import { Hash, Target, Trophy } from "lucide-react";

import { MetricTile } from "@/components/molecules/MetricTile";
import { cn } from "@/lib/utils";

export interface QuizMetricsRowProps {
  score: number;
  rank: number;
  correctCount: number;
  total: number;
  className?: string;
}

export function QuizMetricsRow({
  score,
  rank,
  correctCount,
  total,
  className,
}: Readonly<QuizMetricsRowProps>) {
  return (
    <div className={cn("grid grid-cols-3 gap-3", className)}>
      <MetricTile label="Score" value={score.toLocaleString()} icon={<Trophy className="size-4" />} tone="primary" />
      <MetricTile label="Rank" value={`#${rank}`} icon={<Hash className="size-4" />} tone="info" />
      <MetricTile
        label="Correct"
        value={`${correctCount}/${total}`}
        icon={<Target className="size-4" />}
        tone="success"
      />
    </div>
  );
}

export default QuizMetricsRow;
