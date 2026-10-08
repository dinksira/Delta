/**
 * AchievementCard.variants
 * Shared Tailwind class maps for `AchievementCard`. Every value resolves to
 * a design token — no arbitrary colours or spacing.
 *
 * State is carried by the chip's icon *and* its text, so the reward state
 * never depends on colour alone.
 */

import { Banknote, CheckCircle2, Lock, type LucideIcon } from "lucide-react";

import type { AchievementCardStatus } from "./AchievementCard.types";

/** Row shell: badge, flexible body, optional reward chip. */
export const rowClasses = "flex items-center gap-3 py-3";

/** Muted treatment while the achievement is still locked. */
export const lockedRowClasses = "opacity-60";

/** Badge circle; tone follows the reward state. */
export const iconBadgeClasses = "flex size-10 shrink-0 items-center justify-center rounded-full";

/** Text stack grows so the chip stays pinned right. */
export const bodyClasses = "min-w-0 flex-1";
export const titleClasses = "truncate text-sm font-semibold text-text-primary";
export const descriptionClasses = "truncate text-xs text-text-secondary";

/** Badge tint per state: muted while locked, primary until credited, success after. */
export const iconToneClasses: Readonly<Record<AchievementCardStatus, string>> = {
  locked: "bg-surface-muted text-text-secondary ring-1 ring-inset ring-border-default",
  pending: "bg-primary-600 text-white dark:bg-primary-500",
  claimed: "bg-success-600 text-white dark:bg-success-500",
};

/** Reward chip pill per state. */
export const chipClasses: Readonly<Record<AchievementCardStatus, string>> = {
  locked: "bg-surface-muted text-text-secondary ring-1 ring-inset ring-border-default",
  pending: "bg-primary-50 text-primary-700 ring-1 ring-inset ring-primary-100",
  claimed: "bg-success-50 text-success-700 ring-1 ring-inset ring-success-100",
};

/** Glyph per state: lock while locked, banknote until credited, check after. */
export const chipIcon: Readonly<Record<AchievementCardStatus, LucideIcon>> = {
  locked: Lock,
  pending: Banknote,
  claimed: CheckCircle2,
};

/** Screen-reader state text; the visible label already carries "credited". */
export const chipStateText: Readonly<Record<AchievementCardStatus, string>> = {
  locked: "— locked",
  pending: "— pending credit",
  claimed: "— credited to wallet",
};
