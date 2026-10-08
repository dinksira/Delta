import { cn } from "@/lib/utils";

import type { AchievementCardProps, AchievementCardStatus } from "./AchievementCard.types";
import {
  bodyClasses,
  chipClasses,
  chipIcon,
  chipStateText,
  descriptionClasses,
  iconBadgeClasses,
  iconToneClasses,
  lockedRowClasses,
  rowClasses,
  titleClasses,
} from "./variants";

export type { AchievementCardProps, AchievementCardStatus } from "./AchievementCard.types";

export function AchievementCard({
  icon,
  title,
  description,
  locked = false,
  rewardEtb,
  rewarded = false,
  className,
}: Readonly<AchievementCardProps>) {
  const status: AchievementCardStatus = locked ? "locked" : rewarded ? "claimed" : "pending";
  const ChipIcon = chipIcon[status];
  const showReward = typeof rewardEtb === "number" && rewardEtb > 0;

  return (
    <div className={cn(rowClasses, locked && lockedRowClasses, className)} data-status={status}>
      {icon && <div className={cn(iconBadgeClasses, iconToneClasses[status])}>{icon}</div>}
      <div className={bodyClasses}>
        <p className={titleClasses}>{title}</p>
        <p className={descriptionClasses}>{description}</p>
      </div>
      {showReward && (
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
            chipClasses[status],
          )}
        >
          <ChipIcon className="size-3" aria-hidden="true" />
          {rewardEtb} ETB{status === "claimed" ? " credited" : ""}
          <span className="sr-only">{chipStateText[status]}</span>
        </span>
      )}
    </div>
  );
}

export default AchievementCard;
