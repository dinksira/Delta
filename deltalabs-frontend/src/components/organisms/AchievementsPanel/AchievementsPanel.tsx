import type { ReactNode } from "react";

import { Banknote, Trophy } from "lucide-react";

import { AchievementCard } from "@/components/molecules/AchievementCard/AchievementCard";
import type { Achievement } from "@/modules/Competition/types/hub";
import { cn } from "@/lib/utils";
import { formatETB } from "@/modules/Wallet";

export type AchievementConfig = Achievement & { icon?: ReactNode };
export interface AchievementsPanelProps {
  achievements: AchievementConfig[];
  className?: string;
}

export function AchievementsPanel({ achievements, className }: Readonly<AchievementsPanelProps>) {
  const earnedEtb = achievements
    .filter((achievement) => achievement.rewarded)
    .reduce((total, achievement) => total + achievement.rewardEtb, 0);

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
        {earnedEtb > 0 && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-50 px-2.5 py-0.5 text-xs font-semibold text-success-700 ring-1 ring-inset ring-success-100">
            <Banknote className="size-3" aria-hidden="true" />
            {formatETB(earnedEtb)} ETB earned
          </span>
        )}
      </div>

      {achievements.length === 0 ? (
        <p className="mt-3 text-sm text-text-secondary">
          No achievements yet — enter a competition to unlock your first reward.
        </p>
      ) : (
        <div className="mt-3 divide-y divide-border-default">
          {achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              title={achievement.title}
              description={achievement.description}
              icon={achievement.icon}
              locked={!achievement.unlocked}
              rewardEtb={achievement.rewardEtb}
              rewarded={achievement.rewarded}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default AchievementsPanel;
