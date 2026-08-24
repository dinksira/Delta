import { Trophy } from "lucide-react";

import { TopicBattleCard } from "@/components/organisms/TopicBattleCard/TopicBattleCard";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";
import { cn } from "@/lib/utils";

export interface TopicBattleGridProps {
  battles: TopicBattle[];
  onJoin?: (id: string) => void;
  onResume?: (id: string) => void;
  onOpen?: (id: string) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
}

export function TopicBattleGrid({
  battles,
  onJoin,
  onResume,
  onOpen,
  emptyTitle = "No competitions found",
  emptyDescription = "Competitions will appear here once they are hosted.",
  className,
}: Readonly<TopicBattleGridProps>) {
  if (battles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border-default p-12 text-center">
        <Trophy className="size-8 text-text-tertiary" aria-hidden />
        <p className="mt-3 text-lg font-medium text-text-primary">
          {emptyTitle}
        </p>
        <p className="mt-1 text-sm text-text-secondary">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3",
        className,
      )}
    >
      {battles.map((battle) => (
        <TopicBattleCard
          key={battle.id}
          battle={battle}
          onJoin={onJoin}
          onResume={onResume}
          onOpen={onOpen}
        />
      ))}
    </div>
  );
}
