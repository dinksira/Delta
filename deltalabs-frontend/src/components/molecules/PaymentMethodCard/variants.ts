/**
 * PaymentMethodCard.variants
 * Shared Tailwind class maps and the provider registry for `PaymentMethodCard`.
 * Every value resolves to a design token — no arbitrary colours or spacing.
 */

import {
  Building2,
  CreditCard,
  Landmark,
  Nfc,
  Smartphone,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import type { PaymentMethodCardStatus, PaymentMethodIconKey } from "./PaymentMethodCard.types";

/** Card shell: bordered row that tints its border on hover/focus-within. */
export const cardClasses =
  "flex items-start gap-3 rounded-xl border border-border-default bg-surface-default p-4 transition-colors hover:border-primary-200 focus-within:border-primary-200";

/** 40px rounded-square provider badge. */
export const iconBadgeClasses = "flex size-10 shrink-0 items-center justify-center rounded-lg";

/** Soft token tint per provider, so the badge reads as a brand slot. */
export const methodToneClasses: Readonly<Record<PaymentMethodIconKey, string>> = {
  telebirr: "bg-primary-50 text-primary-600 ring-1 ring-inset ring-primary-100",
  mpesa: "bg-success-50 text-success-600 ring-1 ring-inset ring-success-100",
  cbe: "bg-info-50 text-info-600 ring-1 ring-inset ring-info-100",
  awash: "bg-secondary-50 text-secondary-600 ring-1 ring-inset ring-secondary-100",
  amole: "bg-warning-50 text-warning-600 ring-1 ring-inset ring-warning-100",
  chapa: "bg-surface-muted text-text-secondary ring-1 ring-inset ring-border-default",
};

/** Provider key → lucide glyph. */
export const methodIconMap: Readonly<Record<PaymentMethodIconKey, LucideIcon>> = {
  telebirr: Smartphone,
  mpesa: Nfc,
  cbe: Landmark,
  awash: Building2,
  amole: WalletCards,
  chapa: CreditCard,
};

/** Status pill: text always accompanies the colour, so state is never colour-only. */
export const statusClasses: Readonly<Record<PaymentMethodCardStatus, string>> = {
  verified: "bg-success-50 text-success-600 ring-1 ring-inset ring-success-100",
  pending: "bg-warning-50 text-warning-700 ring-1 ring-inset ring-warning-100",
};

/** Default-method chip. */
export const defaultChipClasses =
  "inline-flex items-center gap-1 rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-semibold text-primary-700 ring-1 ring-inset ring-primary-100";

/** Small text actions on the right of the card. */
export const actionClasses =
  "text-xs font-semibold text-primary-600 transition-colors hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 rounded";
export const dangerActionClasses =
  "text-xs font-semibold text-error-500 transition-colors hover:text-error-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500/40 rounded";
