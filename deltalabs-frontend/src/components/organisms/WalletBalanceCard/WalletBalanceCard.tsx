/**
 * WalletBalanceCard
 * Organism: the wallet hero. A deep-teal gradient panel showing the total
 * balance (pre-formatted), optional wallet-id and pending chips, and up to
 * three money actions — Top up (solid), Withdraw and Send (outlined).
 *
 * Presentational: flow state lives in the feature hooks that open the
 * matching dialogs.
 *
 * @example
 * ```tsx
 * <WalletBalanceCard
 *   label="Total balance"
 *   balanceLabel="12,450.50"
 *   walletId="DL-4821"
 *   pendingLabel="250.00 incoming"
 *   onTopUp={() => setAction("topup")}
 *   onWithdraw={() => setAction("withdraw")}
 *   onSend={() => setAction("send")}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** Clock glyph, class merger, prop contract, variant maps. */
import { Clock } from "lucide-react";

import { cn } from "@/lib/utils";
import type { WalletBalanceCardProps } from "./WalletBalanceCard.types";
import {
  actionIconMap,
  amountClasses,
  blobClasses,
  blobLargeClasses,
  blobSmallClasses,
  cardClasses,
  chipClasses,
  labelClasses,
  primaryActionClasses,
  secondaryActionClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ SUBCOMPONENTS ############################# */
/** Helper sub-components local to this file. */

/** One money action rendered as a button with its glyph. */
function BalanceAction({
  kind,
  label,
  variant,
  onClick,
}: Readonly<{
  kind: "topup" | "withdraw" | "send";
  label: string;
  variant: "primary" | "secondary";
  onClick: () => void;
}>) {
  const Icon = actionIconMap[kind];
  return (
    <button
      type="button"
      className={variant === "primary" ? primaryActionClasses : secondaryActionClasses}
      onClick={onClick}
    >
      <Icon className="size-4" aria-hidden="true" />
      {label}
    </button>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function WalletBalanceCard({
  label,
  balanceLabel,
  currencyLabel = "ETB",
  walletId,
  pendingLabel,
  onTopUp,
  onWithdraw,
  onSend,
  className,
}: Readonly<WalletBalanceCardProps>) {
  return (
    <section aria-label={label} className={cn(cardClasses, className)}>
      <span className={cn(blobClasses, blobLargeClasses)} aria-hidden="true" />
      <span className={cn(blobClasses, blobSmallClasses)} aria-hidden="true" />

      <div className="relative flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className={labelClasses}>
            {label} · {currencyLabel}
          </p>
          <p className={amountClasses}>
            <span className="mr-2 text-2xl font-bold text-white/70 sm:text-3xl">
              {currencyLabel}
            </span>
            {balanceLabel}
          </p>
        </div>
        {walletId ? <span className={chipClasses}>{walletId}</span> : null}
      </div>

      {pendingLabel ? (
        <p className={cn("relative mt-4 w-fit", chipClasses)}>
          <Clock className="size-3.5" aria-hidden="true" />
          {pendingLabel}
        </p>
      ) : null}

      <div className="relative mt-6 flex flex-wrap items-center gap-3">
        {onTopUp ? (
          <BalanceAction kind="topup" label="Top up" variant="primary" onClick={onTopUp} />
        ) : null}
        {onWithdraw ? (
          <BalanceAction
            kind="withdraw"
            label="Withdraw"
            variant="secondary"
            onClick={onWithdraw}
          />
        ) : null}
        {onSend ? (
          <BalanceAction kind="send" label="Send" variant="secondary" onClick={onSend} />
        ) : null}
      </div>
    </section>
  );
}

WalletBalanceCard.displayName = "WalletBalanceCard";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default WalletBalanceCard;
/** ################################ /EXPORTS ############################# */
