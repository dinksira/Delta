/**
 * WalletActionDialog
 * Feature dialog covering the three money flows — top up, withdraw, and
 * send — over the shared `Modal` atom. A three-step stepper (details →
 * review → done) keeps one confirmation screen between the user and any
 * balance change; validation runs before review and again inside the API.
 *
 * Presentational inputs are local `useState`; server state (balance,
 * methods) is passed in and refreshed by the module's query invalidation.
 *
 * @example
 * ```tsx
 * <WalletActionDialog
 *   action="withdraw"
 *   isOpen={action === "withdraw"}
 *   onClose={() => setAction(null)}
 *   balance={balance.available}
 *   methods={methods}
 * />
 * ```
 */

"use client";

/** ################################ IMPORT ############################# */
/** React state, glyphs, shared dialog/form primitives, module contracts. */
import { useEffect, useMemo, useState } from "react";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Modal } from "@/components/atoms/Modal";
import { Select } from "@/components/theme/Select";
import { MIN_AMOUNT_ETB } from "@/modules/Wallet/api/walletApi";
import { useSendMoney, useTopUp, useWithdraw } from "@/modules/Wallet/hooks/useWallet";
import type { PaymentMethod, WalletAction } from "@/modules/Wallet/types/walletTypes";
import {
  formatCurrency,
  isRecipientPhone,
  parseAmountInput,
} from "@/modules/Wallet/utils/walletFormat";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the dialog. */
export type WalletActionDialogProps = {
  /** Which money flow to run. */
  action: WalletAction;
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog. */
  onClose: () => void;
  /** Available balance in ETB, used for validation and review copy. */
  balance: number;
  /** Stored payment methods; only `verified` ones are selectable. */
  methods: readonly PaymentMethod[];
};
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Static copy per flow. */
const TITLES: Readonly<Record<WalletAction, string>> = {
  topup: "Top up wallet",
  withdraw: "Withdraw funds",
  send: "Send money",
};

const CONFIRM_LABELS: Readonly<Record<WalletAction, string>> = {
  topup: "Confirm top up",
  withdraw: "Confirm withdrawal",
  send: "Confirm & send",
};

const SUCCESS_COPY: Readonly<Record<WalletAction, (amount: string) => string>> = {
  topup: (amount) => `${amount} has been added to your wallet.`,
  withdraw: (amount) => `${amount} is on its way. Withdrawals settle within 24 hours.`,
  send: (amount) => `${amount} was sent successfully.`,
};

type Step = "details" | "review" | "done";
/** ################################ /CONSTANTS ############################# */

/** ################################ HELPERS ############################# */
/** Error extraction — mirrors the repo's `handleApiError` chain. */
function toErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Something went wrong. Please try again.";
}
/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function WalletActionDialog({
  action,
  isOpen,
  onClose,
  balance,
  methods,
}: Readonly<WalletActionDialogProps>) {
  const verifiedMethods = useMemo(() => methods.filter((m) => m.status === "verified"), [methods]);
  const defaultMethodId = useMemo(
    () => verifiedMethods.find((m) => m.isDefault)?.id ?? verifiedMethods[0]?.id ?? "",
    [verifiedMethods],
  );

  const [step, setStep] = useState<Step>("details");
  const [methodId, setMethodId] = useState(defaultMethodId);
  const [recipient, setRecipient] = useState("");
  const [amountRaw, setAmountRaw] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const topUp = useTopUp();
  const withdraw = useWithdraw();
  const sendMoney = useSendMoney();
  const mutation = action === "topup" ? topUp : action === "withdraw" ? withdraw : sendMoney;

  // Fresh state for every opening / flow switch.
  useEffect(() => {
    if (!isOpen) return;
    setStep("details");
    setMethodId(defaultMethodId);
    setRecipient("");
    setAmountRaw("");
    setFieldError(null);
    setConfirmError(null);
    topUp.reset();
    withdraw.reset();
    sendMoney.reset();
    // Reset only when the dialog opens or the flow changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, action, defaultMethodId]);

  const needsMethod = action !== "send";
  const noMethod = needsMethod && verifiedMethods.length === 0;

  const handleContinue = () => {
    const amount = parseAmountInput(amountRaw);
    if (amount === null) {
      setFieldError("Enter a valid amount.");
      return;
    }
    if (amount < MIN_AMOUNT_ETB) {
      setFieldError(`Minimum amount is ETB ${MIN_AMOUNT_ETB}.`);
      return;
    }
    if (action !== "topup" && amount > balance) {
      setFieldError("Amount exceeds the available balance.");
      return;
    }
    if (action === "send" && !isRecipientPhone(recipient)) {
      setFieldError("Enter a valid phone number.");
      return;
    }
    if (needsMethod && !methodId) {
      setFieldError("Choose a payment method.");
      return;
    }
    setFieldError(null);
    setStep("review");
  };

  const handleConfirm = async () => {
    const amount = parseAmountInput(amountRaw);
    if (amount === null) return;
    setConfirmError(null);
    try {
      if (action === "topup") await topUp.mutateAsync({ methodId, amount });
      else if (action === "withdraw") await withdraw.mutateAsync({ methodId, amount });
      else await sendMoney.mutateAsync({ recipient: recipient.trim(), amount });
      setStep("done");
    } catch (error) {
      setConfirmError(toErrorMessage(error));
    }
  };

  const amountValue = parseAmountInput(amountRaw);
  const selectedMethod = verifiedMethods.find((m) => m.id === methodId);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={TITLES[action]} className="max-w-md">
      {step === "details" ? (
        <div className="flex flex-col gap-4">
          {noMethod ? (
            <p className="rounded-lg bg-warning-50 px-4 py-3 text-sm text-warning-700" role="alert">
              No verified payment methods yet. Add one from the Payment methods panel first.
            </p>
          ) : null}

          {action === "send" ? (
            <Field id="wallet-recipient" label="Recipient phone number">
              <Input
                id="wallet-recipient"
                inputMode="tel"
                placeholder="+251912345678"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
              />
            </Field>
          ) : (
            <Field id="wallet-method" label={action === "topup" ? "Pay with" : "Withdraw to"}>
              <Select
                id="wallet-method"
                value={methodId}
                onChange={(e) => setMethodId(e.target.value)}
              >
                {verifiedMethods.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label} · {m.accountLabel}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <Field id="wallet-amount" label="Amount" errorMessage={fieldError ?? undefined}>
            <Input
              id="wallet-amount"
              inputMode="decimal"
              placeholder="0.00"
              value={amountRaw}
              onChange={(e) => setAmountRaw(e.target.value)}
            />
          </Field>
          <p className="text-xs text-text-secondary">
            {action === "topup"
              ? `Minimum top up is ETB ${MIN_AMOUNT_ETB}.`
              : `Available: ${formatCurrency(balance)} · minimum ETB ${MIN_AMOUNT_ETB}.`}
          </p>

          <div className="mt-1 flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleContinue} disabled={noMethod}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "review" ? (
        <div className="flex flex-col gap-4">
          <dl className="flex flex-col gap-2 rounded-lg border border-border-default bg-surface-muted p-4 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Amount</dt>
              <dd className="font-semibold tabular-nums text-text-primary">
                {amountValue !== null ? formatCurrency(amountValue) : "—"}
              </dd>
            </div>
            {action === "send" ? (
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">To</dt>
                <dd className="truncate font-semibold text-text-primary">{recipient}</dd>
              </div>
            ) : (
              <div className="flex justify-between gap-4">
                <dt className="text-text-secondary">{action === "topup" ? "From" : "To"}</dt>
                <dd className="truncate font-semibold text-text-primary">
                  {selectedMethod
                    ? `${selectedMethod.label} · ${selectedMethod.accountLabel}`
                    : "—"}
                </dd>
              </div>
            )}
            <div className="flex justify-between gap-4">
              <dt className="text-text-secondary">Fee</dt>
              <dd className="font-semibold text-text-primary">Free</dd>
            </div>
          </dl>

          {confirmError ? (
            <p
              role="alert"
              className="flex items-center gap-2 rounded-lg bg-error-50 px-4 py-3 text-sm text-error-600"
            >
              <CircleAlert className="size-4 shrink-0" aria-hidden="true" />
              {confirmError}
            </p>
          ) : null}

          <div className="flex justify-between gap-2">
            <Button
              variant="ghost"
              onClick={() => setStep("details")}
              disabled={mutation.isPending}
            >
              Back
            </Button>
            <Button onClick={handleConfirm} disabled={mutation.isPending}>
              {mutation.isPending ? "Processing…" : CONFIRM_LABELS[action]}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "done" ? (
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <span className="inline-flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600">
            <CheckCircle2 className="size-7" aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold text-text-primary">
            {SUCCESS_COPY[action](amountValue !== null ? formatCurrency(amountValue) : "")}
          </p>
          <Button className="mt-2 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

WalletActionDialog.displayName = "WalletActionDialog";
/** ################################ /COMPONENT ############################# */
