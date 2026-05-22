/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/**
 * Chip / tinted surfaces using `design-tokens.css` `--color-features-chip-*` (same pattern as `FeaturesPageView`).
 */
export const schoolFeatureChip = {
  slate: "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
  cyan: "bg-[color:var(--color-features-chip-cyan-bg)] text-[color:var(--color-features-chip-cyan-fg)]",
  violet: "bg-[color:var(--color-features-chip-violet-bg)] text-[color:var(--color-features-chip-violet-fg)]",
  amber: "bg-[color:var(--color-features-chip-amber-bg)] text-[color:var(--color-features-chip-amber-fg)]",
  rose: "bg-[color:var(--color-features-chip-rose-bg)] text-[color:var(--color-features-chip-rose-fg)]",
  emerald: "bg-[color:var(--color-features-chip-emerald-bg)] text-[color:var(--color-features-chip-emerald-fg)]",
} as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
export type SchoolFeatureChipTone = keyof typeof schoolFeatureChip;

/** Shared focus + layout for chip-styled table actions (tokens only; use with `schoolFeatureChip`). */
const chipActionBase =
  "inline-flex w-full min-w-0 cursor-pointer items-center justify-center rounded-md px-2 py-2 text-xs font-semibold shadow-none transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300/60 disabled:cursor-not-allowed disabled:pointer-events-none disabled:opacity-50";

/** ################################ /TYPES ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
export function schoolChipActionButtonClass(tone: SchoolFeatureChipTone): string {
  return cx(chipActionBase, schoolFeatureChip[tone]);
}
/** ################################ /HELPERS ############################# */
