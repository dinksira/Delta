/**
 * AchievementCard.types
 * Prop types for the `AchievementCard` molecule.
 *
 * The row shows an ETB reward chip whose icon and label track the reward's
 * lifecycle (`locked` → `pending` → `claimed`), so a prize reads together
 * with whether it has actually been credited — never colour alone.
 *
 * @example
 * ```tsx
 * <AchievementCard
 *   icon={<Footprints className="size-5" />}
 *   title="First Steps"
 *   description="Joined your first competition"
 *   locked={false}
 *   rewardEtb={10}
 *   rewarded
 * />
 * ```
 */

import type { ReactNode } from "react";

/** Lifecycle of an achievement's ETB reward. */
export type AchievementCardStatus = "locked" | "pending" | "claimed";

/** Public props for `AchievementCard`. */
export interface AchievementCardProps {
  /** Glyph rendered inside the circular badge. Hidden when omitted. */
  icon?: ReactNode;
  /** Achievement name. */
  title: string;
  /** One-line requirement, e.g. `"Joined 10 competitions"`. */
  description: string;
  /** True while the achievement has not been unlocked yet. */
  locked?: boolean;
  /** ETB paid into the wallet on unlock. Chip hides when omitted or zero. */
  rewardEtb?: number;
  /** Whether the reward has been credited to the wallet ledger. */
  rewarded?: boolean;
  /** Extra classes merged onto the row root. */
  className?: string;
}
