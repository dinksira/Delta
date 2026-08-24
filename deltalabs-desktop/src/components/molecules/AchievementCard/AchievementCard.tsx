import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface AchievementCardProps {
  icon?: ReactNode;
  title: string;
  description: string;
  locked?: boolean;
  className?: string;
}

export function AchievementCard({
  icon,
  title,
  description,
  locked = false,
  className,
}: Readonly<AchievementCardProps>) {
  return (
    <div className={cn("flex items-center gap-3 py-3", locked && "opacity-60", className)}>
      {icon && (
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white dark:bg-primary-500 dark:text-white">
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-text-primary">{title}</p>
        <p className="truncate text-xs text-text-secondary">{description}</p>
      </div>
    </div>
  );
}

export default AchievementCard;
