/**
 * WalletPageView
 * Page composition for `/wallet`: header, balance hero, activity feed with
 * direction filters, payment-methods panel, and the three money dialogs.
 * All data flows through the module's TanStack Query hooks — server state
 * lives there, dialog/filter state lives here.
 *
 * @example
 * ```tsx
 * <WalletPageView />
 * ```
 */

"use client";

/** ################################ IMPORT ############################# */
/** Shared primitives, library components, module hooks/features/utils. */
import { useState } from "react";

import { Plus, ShieldCheck } from "lucide-react";

import { Modal } from "@/components/atoms/Modal";
import { PaymentMethodCard } from "@/components/molecules/PaymentMethodCard";
import { TransactionItem } from "@/components/molecules/TransactionItem";
import { WalletBalanceCard } from "@/components/organisms/WalletBalanceCard";
import { Button } from "@/components/theme/Button";
import { AddPaymentMethodDialog } from "@/modules/Wallet/features/AddPaymentMethodDialog";
import { WalletActionDialog } from "@/modules/Wallet/features/WalletActionDialog";
import {
  usePaymentMethods,
  useRemovePaymentMethod,
  useSetDefaultPaymentMethod,
  useWalletBalance,
  useWalletTransactions,
} from "@/modules/Wallet/hooks/useWallet";
import type { PaymentMethod, WalletAction } from "@/modules/Wallet/types/walletTypes";
import { formatETB } from "@/modules/Wallet/utils/walletFormat";
import { cn } from "@/lib/utils";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Activity filter ids. */
type ActivityFilter = "all" | "in" | "out";
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Filter chips shown above the activity feed. */
const FILTERS: readonly { id: ActivityFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "in", label: "Money in" },
  { id: "out", label: "Money out" },
];

const filterChipClasses =
  "rounded-full px-3 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";
const filterActiveClasses = "bg-surface-default text-text-primary shadow-sm";
const filterIdleClasses = "text-text-secondary hover:text-text-primary";
/** ################################ /CONSTANTS ############################# */

/** ################################ SUBCOMPONENTS ############################# */
/** Loading skeletons and the remove-method confirmation. */

/** Pulse placeholder rows shared by the three data panels. */
function SkeletonRows({ count }: Readonly<{ count: number }>) {
  return (
    <div className="flex flex-col gap-3 p-5" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="h-12 animate-pulse rounded-lg bg-surface-muted" />
      ))}
    </div>
  );
}

/** Dashed empty-state panel matching the repo's bordered empty pattern. */
function EmptyPanel({ title, hint }: Readonly<{ title: string; hint: string }>) {
  return (
    <div className="m-5 rounded-xl border border-dashed border-border-default px-4 py-8 text-center">
      <p className="text-sm font-semibold text-text-primary">{title}</p>
      <p className="mt-1 text-xs text-text-secondary">{hint}</p>
    </div>
  );
}

/** Inline error strip with a retry affordance. */
function ErrorPanel({ message, onRetry }: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="m-5 flex flex-col gap-3 rounded-xl bg-error-50 px-4 py-4" role="alert">
      <p className="text-sm text-error-600">{message}</p>
      <Button variant="outlineInverse" size="sm" className="w-fit text-error-600" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

/** Confirmation gate before a payment method is removed. */
function ConfirmRemoveDialog({
  method,
  onClose,
  onConfirm,
  isPending,
}: Readonly<{
  method: PaymentMethod | null;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}>) {
  return (
    <Modal
      isOpen={method !== null}
      onClose={onClose}
      title="Remove payment method"
      className="max-w-sm"
      ariaLabel="Remove payment method"
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-text-secondary">
          Remove <span className="font-semibold text-text-primary">{method?.label}</span> (
          {method?.accountLabel}) from your wallet? You can link it again later.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isPending}>
            {isPending ? "Removing…" : "Remove"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
/** ################################ /SUBCOMPONENTS ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function WalletPageView() {
  const balanceQuery = useWalletBalance();
  const methodsQuery = usePaymentMethods();
  const transactionsQuery = useWalletTransactions();

  const removeMethod = useRemovePaymentMethod();
  const setDefaultMethod = useSetDefaultPaymentMethod();

  const [filter, setFilter] = useState<ActivityFilter>("all");
  const [action, setAction] = useState<WalletAction | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<PaymentMethod | null>(null);
  const [methodsError, setMethodsError] = useState<string | null>(null);

  const balance = balanceQuery.data;
  const methods = methodsQuery.data ?? [];
  const verifiedMethods = methods.filter((m) => m.status === "verified");
  const transactions = (transactionsQuery.data ?? []).filter((t) =>
    filter === "all" ? true : t.direction === filter,
  );

  /** Top up / withdraw need a verified method; without one, jump to add. */
  const openMoneyFlow = (next: WalletAction) => {
    if (next !== "send" && verifiedMethods.length === 0) {
      setAddOpen(true);
      return;
    }
    setAction(next);
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setMethodsError(null);
    try {
      await removeMethod.mutateAsync(removeTarget.id);
      setRemoveTarget(null);
    } catch (error) {
      setMethodsError(error instanceof Error ? error.message : "Could not remove this method.");
    }
  };

  const handleSetDefault = async (methodId: string) => {
    setMethodsError(null);
    try {
      await setDefaultMethod.mutateAsync(methodId);
    } catch (error) {
      setMethodsError(
        error instanceof Error ? error.message : "Could not update your default method.",
      );
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Wallet</h1>
          <p className="mt-1 text-sm text-text-secondary">
            Top up, withdraw, and track every birr in one place.
          </p>
        </div>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        {/* Money + activity */}
        <div className="flex flex-col gap-6 lg:col-span-2">
          {balanceQuery.isLoading ? (
            <div className="h-52 animate-pulse rounded-2xl bg-surface-muted" aria-hidden="true" />
          ) : balance ? (
            <WalletBalanceCard
              label="Total balance"
              balanceLabel={formatETB(balance.available)}
              currencyLabel={balance.currency}
              walletId={balance.walletId}
              pendingLabel={
                balance.pendingIn > 0 ? `${formatETB(balance.pendingIn)} incoming` : null
              }
              onTopUp={() => openMoneyFlow("topup")}
              onWithdraw={() => openMoneyFlow("withdraw")}
              onSend={() => setAction("send")}
            />
          ) : (
            <ErrorPanel
              message={
                balanceQuery.error instanceof Error
                  ? balanceQuery.error.message
                  : "Could not load your balance."
              }
              onRetry={() => void balanceQuery.refetch()}
            />
          )}

          <section
            aria-labelledby="wallet-activity-heading"
            className="overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-sm"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border-subtle px-5 py-4">
              <h2 id="wallet-activity-heading" className="text-lg font-semibold text-text-primary">
                Recent activity
              </h2>
              <div
                role="group"
                aria-label="Filter activity"
                className="flex items-center gap-1 rounded-full bg-surface-muted p-1"
              >
                {FILTERS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    aria-pressed={filter === f.id}
                    className={cn(
                      filterChipClasses,
                      filter === f.id ? filterActiveClasses : filterIdleClasses,
                    )}
                    onClick={() => setFilter(f.id)}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </header>

            {transactionsQuery.isLoading ? (
              <SkeletonRows count={4} />
            ) : transactionsQuery.isError ? (
              <ErrorPanel
                message={
                  transactionsQuery.error instanceof Error
                    ? transactionsQuery.error.message
                    : "Could not load your activity."
                }
                onRetry={() => void transactionsQuery.refetch()}
              />
            ) : transactions.length === 0 ? (
              <EmptyPanel
                title="Nothing here yet"
                hint="Transactions matching this filter will appear here."
              />
            ) : (
              <ul className="divide-y divide-border-subtle">
                {transactions.map((t) => (
                  <TransactionItem
                    key={t.id}
                    direction={t.direction}
                    title={t.title}
                    subtitle={t.subtitle}
                    amountLabel={`${t.amount > 0 ? "+" : "-"}${formatETB(t.amount)}`}
                    status={t.status}
                    timestamp={t.createdAt}
                    timestampLabel={new Date(t.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  />
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Methods + security note */}
        <aside className="flex flex-col gap-6" aria-labelledby="wallet-methods-heading">
          <section
            aria-labelledby="wallet-methods-heading"
            className="rounded-2xl border border-border-default bg-surface-default p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="wallet-methods-heading" className="text-lg font-semibold text-text-primary">
                Payment methods
              </h2>
              <span className="text-xs text-text-secondary">{methods.length} linked</span>
            </div>

            {methodsQuery.isLoading ? (
              <SkeletonRows count={3} />
            ) : methodsQuery.isError ? (
              <ErrorPanel
                message={
                  methodsQuery.error instanceof Error
                    ? methodsQuery.error.message
                    : "Could not load your methods."
                }
                onRetry={() => void methodsQuery.refetch()}
              />
            ) : (
              <div className="mt-4 flex flex-col gap-3">
                {methods.map((m) => (
                  <PaymentMethodCard
                    key={m.id}
                    iconKey={m.kind}
                    label={m.label}
                    accountLabel={m.accountLabel}
                    status={m.status}
                    isDefault={m.isDefault}
                    onSetDefault={
                      m.status === "verified" && !m.isDefault
                        ? () => void handleSetDefault(m.id)
                        : undefined
                    }
                    onRemove={() => setRemoveTarget(m)}
                  />
                ))}

                {methodsError ? (
                  <p role="alert" className="text-xs text-error-600">
                    {methodsError}
                  </p>
                ) : null}

                <button
                  type="button"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border-default py-3 text-sm font-semibold text-primary-600 transition-colors hover:border-primary-300 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                  onClick={() => setAddOpen(true)}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add payment method
                </button>
              </div>
            )}
          </section>

          <section className="rounded-2xl border border-border-default bg-surface-muted p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShieldCheck className="size-4 text-primary-600" aria-hidden="true" />
              Protected payments
            </h2>
            <p className="mt-2 text-xs leading-relaxed text-text-secondary">
              Your account numbers stay masked, and every top up, withdrawal, or transfer is
              confirmed with you before it leaves the wallet.
            </p>
          </section>
        </aside>
      </div>

      {action ? (
        <WalletActionDialog
          action={action}
          isOpen
          onClose={() => setAction(null)}
          balance={balance?.available ?? 0}
          methods={verifiedMethods}
        />
      ) : null}

      {addOpen ? <AddPaymentMethodDialog isOpen onClose={() => setAddOpen(false)} /> : null}

      <ConfirmRemoveDialog
        method={removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={() => void handleRemove()}
        isPending={removeMethod.isPending}
      />
    </div>
  );
}

WalletPageView.displayName = "WalletPageView";
/** ################################ /COMPONENT ############################# */
