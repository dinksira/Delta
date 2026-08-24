import { CircleDashed, Gift, Trophy, Users } from "lucide-react";

import { StatCard } from "@/components/molecules/StatCard/StatCard";
import type { HubStats } from "@/modules/Competition/types/hub";
import { cn } from "@/lib/utils";

export interface HubStatsStripProps {
  stats: HubStats;
  className?: string;
}

export function HubStatsStrip({ stats, className }: Readonly<HubStatsStripProps>) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 lg:grid-cols-4",
        className,
      )}
    >
      <StatCard
        label="Competitions"
        value={stats.totalCompetitions}
        icon={<Trophy className="size-5" />}
        tone="primary"
      />
      <StatCard
        label="Players joined"
        value={stats.totalPlayers}
        icon={<Users className="size-5" />}
        tone="info"
      />
      <StatCard
        label="Filling now"
        value={stats.fillingNow}
        icon={<CircleDashed className="size-5" />}
        tone="success"
      />
      <StatCard
        label="Top prize pool"
        value={stats.topPrizePool}
        icon={<Gift className="size-5" />}
        tone="warning"
      />
    </div>
  );
}
