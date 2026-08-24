import type { ReactNode } from "react";

import { Trophy } from "lucide-react";

import { AchievementCard } from "@/components/molecules/AchievementCard/AchievementCard";
import type { Achievement } from "@/modules/Competition/types/hub";
import { cn } from "@/lib/utils";

export type AchievementConfig = Achievement & { icon?: ReactNode };
export interface AchievementsPanelProps {
  achievements: AchievementConfig[];
  className?: string;
}

export function AchievementsPanel({ achievements, className }: Readonly<AchievementsPanelProps>) {
  return (
    <section
      aria-labelledby="achievements-heading"
      className={cn(
        "rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-secondary-600 text-white dark:bg-secondary-500">
          <Trophy className="size-5" />
        </div>
        <h2 id="achievements-heading" className="text-base font-semibold text-text-primary">
          Achievements
        </h2>
      </div>

      <div className="mt-3 divide-y divide-border-default">
        {achievements.map((achievement) => (
          <AchievementCard
            key={achievement.id}
            title={achievement.title}
            description={achievement.description}
            icon={achievement.icon}
            locked={!achievement.unlocked}
          />
        ))}
      </div>
    </section>
  );
}

export default AchievementsPanel;
