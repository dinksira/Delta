/**
 * TransactionItem.types
 * Prop types for the `TransactionItem` molecule.
 *
 * Amounts and dates arrive pre-formatted so the row stays presentational;
 * the ISO timestamp is kept separately for the `<time datetime>` attribute.
 *
 * @example
 * ```tsx
 * <TransactionItem
 *   direction="in"
 *   title="Top up"
 *   subtitle="Telebirr"
 *   amountLabel="+1,500.00"
 *   status="completed"
 *   timestamp="2026-10-08T10:15:00.000Z"
 *   timestampLabel="Today · 10:15"
 * />
 * ```
 */

/** Money direction: credit into the wallet or debit out of it. */
export type TransactionItemDirection = "in" | "out";

/** Lifecycle state of the transaction, rendered as a text pill. */
export type TransactionItemStatus = "completed" | "pending" | "failed";

/** Public props for `TransactionItem`. */
export interface TransactionItemProps {
  /** Credit or debit; drives the icon, tone, and signed amount colour. */
  direction: TransactionItemDirection;
  /** Headline, e.g. `"Top up"` or `"Course enrollment"`. */
  title: string;
  /** Supporting line, e.g. `"Telebirr"` or `"Sent to +2519…"`. */
  subtitle: string;
  /** Pre-formatted signed amount, e.g. `"+1,500.00"` / `"-320.00"`. */
  amountLabel: string;
  /** Currency shown after the amount. Defaults to `"ETB"`. */
  currencyLabel?: string;
  /** Lifecycle state pill: Completed / Pending / Failed. */
  status: TransactionItemStatus;
  /** ISO-8601 timestamp used for `<time datetime>`. */
  timestamp: string;
  /** Pre-formatted relative/absolute date shown to the user. */
  timestampLabel: string;
  /** Extra classes merged onto the row root. */
  className?: string;
}
