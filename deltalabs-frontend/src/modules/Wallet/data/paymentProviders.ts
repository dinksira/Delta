/**
 * paymentProviders
 * Catalogue of wallet providers: the kind key, display name, and the field
 * hint used by the add-method dialog. Single source of truth for labels —
 * the mock store seeds from this list.
 *
 * @example
 * ```ts
 * const telebirr = PAYMENT_PROVIDERS.find((p) => p.kind === "telebirr");
 * ```
 */

/** ################################ IMPORT ############################# */
/** Provider kind type. */
import type { PaymentMethodKind } from "@/modules/Wallet/types/walletTypes";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
/** Static provider catalogue. */

/** One row per provider the wallet supports. */
export type PaymentProvider = Readonly<{
  kind: PaymentMethodKind;
  label: string;
  /** Placeholder/hint for the account field in the add-method dialog. */
  hint: string;
}>;

/** Providers in display order. */
export const PAYMENT_PROVIDERS: readonly PaymentProvider[] = [
  { kind: "telebirr", label: "Telebirr", hint: "e.g. +251912345678" },
  { kind: "mpesa", label: "M-Pesa", hint: "e.g. +251712345678" },
  { kind: "cbe", label: "Commercial Bank of Ethiopia", hint: "Account or CBE Birr number" },
  { kind: "awash", label: "Awash Bank", hint: "Account number" },
  { kind: "amole", label: "Amole", hint: "e.g. +251912345678" },
  { kind: "chapa", label: "Chapa", hint: "Business / collection account" },
] as const;

/** Lookup helper: provider display name for a kind (falls back to the key). */
export function providerLabel(kind: PaymentMethodKind): string {
  return PAYMENT_PROVIDERS.find((p) => p.kind === kind)?.label ?? kind;
}

/** ################################ /CONSTANTS ############################# */
