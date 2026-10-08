/**
 * WalletBalanceCard.variants
 * Shared Tailwind class maps for the `WalletBalanceCard` organism.
 * Every value resolves to a design token — no arbitrary colours or spacing.
 */

import { ArrowDownLeft, ArrowUpRight, Plus, type LucideIcon } from "lucide-react";

/** Gradient hero shell: deep-teal ramp, rounded 2xl, hidden overflow for blobs. */
export const cardClasses =
  "relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-700 via-primary-600 to-primary-800 p-6 text-white shadow-md sm:p-7";

/** Decorative corner blobs; purely visual, so they stay aria-hidden in the JSX. */
export const blobClasses = "pointer-events-none absolute rounded-full bg-white/10";
export const blobLargeClasses = "-right-12 -top-16 size-56";
export const blobSmallClasses = "-bottom-14 -left-10 size-40";

/** Small uppercase label above the balance. */
export const labelClasses = "text-xs font-semibold uppercase tracking-widest text-white/70";

/** Headline balance figure. */
export const amountClasses = "mt-1 text-4xl font-extrabold tabular-nums sm:text-5xl";

/** Rounded chip shared by the wallet-id and pending rows. */
export const chipClasses =
  "inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-inset ring-white/20";

/** Solid white primary action (Top up). */
export const primaryActionClasses =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-semibold text-primary-700 shadow-sm transition-colors hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

/** Outlined secondary action (Withdraw / Send). */
export const secondaryActionClasses =
  "inline-flex h-10 items-center justify-center gap-2 rounded-md px-4 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70";

/** Glyphs for the action buttons, keyed by callback name. */
export const actionIconMap: Readonly<Record<"topup" | "withdraw" | "send", LucideIcon>> = {
  topup: Plus,
  withdraw: ArrowUpRight,
  send: ArrowDownLeft,
};
