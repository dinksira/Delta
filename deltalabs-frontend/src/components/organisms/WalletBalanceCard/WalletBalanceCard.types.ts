/**
 * WalletBalanceCard.types
 * Prop types for the `WalletBalanceCard` organism.
 *
 * Amounts arrive pre-formatted so the card stays presentational and the
 * module owns currency formatting. Action callbacks are optional: when a
 * callback is omitted the matching button is not rendered, so the card can
 * be used in read-only contexts.
 *
 * @example
 * ```tsx
 * <WalletBalanceCard
 *   label="Total balance"
 *   balanceLabel="12,450.50"
 *   currencyLabel="ETB"
 *   walletId="DL-4821"
 *   pendingLabel="250.00 pending"
 *   onTopUp={() => setOpen("topup")}
 *   onWithdraw={() => setOpen("withdraw")}
 *   onSend={() => setOpen("send")}
 * />
 * ```
 */

/** Public props for `WalletBalanceCard`. */
export interface WalletBalanceCardProps {
  /** Small uppercase label above the amount, e.g. `"Total balance"`. */
  label: string;
  /** Pre-formatted available balance, e.g. `"12,450.50"`. */
  balanceLabel: string;
  /** Currency chip shown next to the label. Defaults to `"ETB"`. */
  currencyLabel?: string;
  /** Wallet display id shown in the top-right chip, e.g. `"DL-4821"`. */
  walletId?: string | null;
  /** Pre-formatted incoming-pending note. Rendered only when non-empty. */
  pendingLabel?: string | null;
  /** Opens the top-up flow. Omit to hide the button. */
  onTopUp?: () => void;
  /** Opens the withdraw flow. Omit to hide the button. */
  onWithdraw?: () => void;
  /** Opens the send-money flow. Omit to hide the button. */
  onSend?: () => void;
  /** Extra classes merged onto the card root. */
  className?: string;
}
