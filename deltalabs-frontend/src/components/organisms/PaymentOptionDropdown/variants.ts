/** ################################ VARIANTS ############################# */
/** Class maps, icon registry, and default data for PaymentOptionDropdown. */

import { Ban, CreditCard, Landmark, Wallet, type LucideIcon } from "lucide-react";

import type { PaymentOption, PaymentOptionIcon, PaymentOptionTone } from "./PaymentOptionDropdown.types";

/** Panel sizing only; the surface and anchoring come from `Popover`. */
export const panelWidthClasses = "min-w-64";

/** Inner padding plus vertical rhythm between the search field and list. */
export const panelInnerClasses = "flex flex-col gap-3 p-3";

/** Base row for a single option. */
export const optionClasses =
  "flex w-full cursor-pointer items-center gap-3 rounded-md p-3 text-left transition-colors";

/** Row background when this option is the current selection. */
export const optionSelectedClasses = "bg-primary-50";

/** Row background while an unselected option is hovered or keyboard-focused. */
export const optionIdleClasses = "hover:bg-surface-muted focus-visible:bg-surface-muted";

/** Option label weight and colour, split by selection state. */
export const optionNameSelectedClasses = "text-primary-700";
export const optionNameIdleClasses = "text-text-primary";

/** Square icon badge. */
export const iconBadgeClasses =
  "flex size-8 shrink-0 items-center justify-center rounded-lg text-white";

/** Icon badge fills, keyed by {@link PaymentOptionTone}. */
export const iconToneClasses: Record<PaymentOptionTone, string> = {
  neutral: "bg-text-secondary",
  primary: "bg-primary-600",
  info: "bg-info-600",
  success: "bg-success-600",
};

/** Circular check shown on the selected row. */
export const checkClasses = "flex size-5 shrink-0 items-center justify-center rounded-full bg-primary-600 text-white";

/** Shown when the search query matches nothing. */
export const emptyClasses = "px-3 py-8 text-center text-sm text-text-secondary";

/** Scrollable option list. */
export const listClasses = "max-h-60 overflow-y-auto";

/** Resolves the serialisable icon key to a glyph. */
export const optionIconMap: Record<PaymentOptionIcon, LucideIcon> = {
  none: Ban,
  card: CreditCard,
  bank: Landmark,
  wallet: Wallet,
};

/** Methods offered when the caller does not pass its own list. */
export const PAYMENT_OPTIONS: readonly PaymentOption[] = [
  { id: "none", name: "None", icon: "none", tone: "neutral" },
  { id: "credit-card", name: "Credit Card", icon: "card", tone: "primary" },
  { id: "bank-transfer", name: "Bank Transfer", icon: "bank", tone: "success" },
  { id: "paypal", name: "PayPal", icon: "wallet", tone: "info" },
];
/** ################################ /VARIANTS ############################# */
