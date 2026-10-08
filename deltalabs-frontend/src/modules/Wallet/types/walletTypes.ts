/**
 * walletTypes
 * Shared type contracts for the Wallet module: balance, payment methods,
 * transactions, and the inputs accepted by the wallet API boundary.
 *
 * @example
 * ```ts
 * const input: TopUpInput = { methodId: "pm_telebirr_1", amount: 500 };
 * ```
 */

/** ################################ TYPES ############################# */
/** Type definitions used across the module. */

/** Wallet amounts are always handled in Ethiopian Birr. */
export type CurrencyCode = "ETB";

/** Providers the wallet can store for top-ups and withdrawals. */
export type PaymentMethodKind = "telebirr" | "mpesa" | "cbe" | "awash" | "amole" | "chapa";

/** Verification state of a stored payment method. */
export type PaymentMethodStatus = "verified" | "pending";

/** A stored payment method (wallet → provider account). */
export interface PaymentMethod {
  id: string;
  kind: PaymentMethodKind;
  /** Display name of the provider, e.g. `"Telebirr"`. */
  label: string;
  /** Masked account/phone shown to the user, e.g. `"+2519 •• •• 12"`. */
  accountLabel: string;
  status: PaymentMethodStatus;
  /** The wallet's default method for outgoing flows. */
  isDefault: boolean;
}

/** Credit into the wallet or debit out of it. */
export type TransactionDirection = "in" | "out";

/** What produced the transaction. */
export type TransactionKind = "topup" | "withdraw" | "transfer" | "prize" | "purchase";

/** Lifecycle state of a transaction. */
export type TransactionStatus = "completed" | "pending" | "failed";

/** One entry in the wallet activity feed. */
export interface WalletTransaction {
  id: string;
  direction: TransactionDirection;
  kind: TransactionKind;
  title: string;
  subtitle: string;
  /** Signed amount in ETB: positive credit, negative debit. */
  amount: number;
  status: TransactionStatus;
  /** ISO-8601 timestamp. */
  createdAt: string;
}

/** Snapshot returned by the balance endpoint. */
export interface WalletBalance {
  available: number;
  /** Credits not yet settled, e.g. prize money awaiting confirmation. */
  pendingIn: number;
  currency: CurrencyCode;
  /** Display id for the wallet, e.g. `"DL-4821"`. */
  walletId: string;
}

/** The three money actions the balance card can open. */
export type WalletAction = "topup" | "withdraw" | "send";

/** Input for a top-up. */
export interface TopUpInput {
  methodId: string;
  amount: number;
}

/** Input for a withdrawal. */
export interface WithdrawInput {
  methodId: string;
  amount: number;
}

/** Input for sending money to another phone number. */
export interface SendInput {
  /** Recipient MSISDN, e.g. `"+251912345678"`. */
  recipient: string;
  amount: number;
}

/** Input for storing a new payment method. */
export interface AddPaymentMethodInput {
  kind: PaymentMethodKind;
  /** Raw account/phone entered by the user (masked before display). */
  accountLabel: string;
}

/** ################################ /TYPES ############################# */
