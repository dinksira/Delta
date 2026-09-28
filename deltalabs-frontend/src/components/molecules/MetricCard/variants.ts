/**
 * MetricCard.variants
 * Shared Tailwind class maps and the tone/trend registries for `MetricCard`.
 */

import { TrendingDown, TrendingUp } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { MetricCardTone } from "./MetricCard.types";

/** Card shell: soft shadow, 16px radius, hover lift per the design spec. */
export const cardClasses =
  "flex flex-col rounded-2xl border border-border-subtle bg-surface-muted p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md focus-within:-translate-y-1";

/** 48px rounded-square icon badge. */
export const iconBadgeClasses = "flex size-12 shrink-0 items-center justify-center rounded-xl text-white";

/** Fill tone for the icon badge. */
export const iconToneClasses: Readonly<Record<MetricCardTone, string>> = {
  warning: "bg-warning-400",
  success: "bg-success-500",
  primary: "bg-primary-800",
};

/** Headline figure. */
export const valueClasses = "text-3xl font-extrabold text-text-primary";

/** Top-right pill geometry, shared by the trend and score badges. */
export const badgeClasses = "inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-bold";

/** Trend pills sit on a soft success tint; score pills are solid teal. */
export const trendBadgeClasses = "bg-success-50 text-success-600";
export const scoreBadgeClasses = "bg-primary-800 text-white";

/** Arrow glyphs for a rising or falling delta. */
export const trendIconMap = { up: TrendingUp, down: TrendingDown } as const satisfies Record<
  "up" | "down",
  LucideIcon
>;
