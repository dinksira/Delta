/**
 * TransactionItem.variants
 * Shared Tailwind class maps and the direction/status registries for
 * `TransactionItem`. Every value resolves to a design token.
 */

import { ArrowDownLeft, ArrowUpRight, type LucideIcon } from "lucide-react";

import type { TransactionItemDirection, TransactionItemStatus } from "./TransactionItem.types";

/** Row shell: padded list item that tints its background on hover. */
export const rowClasses =
  "flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted";

/** 40px rounded-square direction badge. */
export const iconBadgeClasses = "flex size-10 shrink-0 items-center justify-center rounded-full";

/** Tone per direction: credits read green, debits read teal. */
export const directionToneClasses: Readonly<Record<TransactionItemDirection, string>> = {
  in: "bg-success-50 text-success-600",
  out: "bg-primary-50 text-primary-600",
};

/** Glyph per direction; decorative, so rows keep real text labels. */
export const directionIconMap: Readonly<Record<TransactionItemDirection, LucideIcon>> = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
};

/** Signed amount colour follows direction and is paired with the +/- sign. */
export const amountClasses: Readonly<Record<TransactionItemDirection, string>> = {
  in: "text-success-600",
  out: "text-text-primary",
};

/** Status pill: text always accompanies the colour, so state is never colour-only. */
export const statusClasses: Readonly<Record<TransactionItemStatus, string>> = {
  completed: "bg-success-50 text-success-600",
  pending: "bg-warning-50 text-warning-700",
  failed: "bg-error-50 text-error-600",
};

/** Human labels for each lifecycle state. */
export const statusLabels: Readonly<Record<TransactionItemStatus, string>> = {
  completed: "Completed",
  pending: "Pending",
  failed: "Failed",
};
