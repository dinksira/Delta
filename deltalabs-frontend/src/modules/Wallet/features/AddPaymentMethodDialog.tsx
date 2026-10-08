/**
 * AddPaymentMethodDialog
 * Feature dialog for linking a new payment method over the shared `Modal`
 * atom: a provider picker (Telebirr, M-Pesa, CBE, Awash, Amole, Chapa),
 * an account/phone step with inline validation, and a success step.
 *
 * Provider tiles reuse the `PaymentMethodCard` icon/tone registry, so the
 * picker and the stored rows always agree on branding.
 *
 * @example
 * ```tsx
 * <AddPaymentMethodDialog isOpen={open} onClose={() => setOpen(false)} />
 * ```
 */

"use client";

/** ################################ IMPORT ############################# */
/** React state, glyphs, shared dialog/form primitives, registries, hooks. */
import { useEffect, useState } from "react";

import { CheckCircle2, CircleAlert } from "lucide-react";

import { methodIconMap, methodToneClasses } from "@/components/molecules/PaymentMethodCard";
import { Modal } from "@/components/atoms/Modal";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { PAYMENT_PROVIDERS } from "@/modules/Wallet/data/paymentProviders";
import { useAddPaymentMethod } from "@/modules/Wallet/hooks/useWallet";
import type { PaymentMethodKind } from "@/modules/Wallet/types/walletTypes";
import { cn } from "@/lib/utils";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the dialog. */
export type AddPaymentMethodDialogProps = {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog. */
  onClose: () => void;
};
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Step machine and tile classes. */
type Step = "provider" | "details" | "done";

const PROVIDER_TILE_CLASSES =
  "flex items-center gap-3 rounded-xl border border-border-default bg-surface-default p-3 text-left transition-colors hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40";
const PROVIDER_TILE_SELECTED_CLASSES = "border-primary-600 bg-primary-50 ring-1 ring-primary-600";
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AddPaymentMethodDialog({ isOpen, onClose }: Readonly<AddPaymentMethodDialogProps>) {
  const [step, setStep] = useState<Step>("provider");
  const [kind, setKind] = useState<PaymentMethodKind | null>(null);
  const [account, setAccount] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const addMethod = useAddPaymentMethod();

  // Fresh state for every opening.
  useEffect(() => {
    if (!isOpen) return;
    setStep("provider");
    setKind(null);
    setAccount("");
    setFieldError(null);
    setConfirmError(null);
    addMethod.reset();
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const selected = PAYMENT_PROVIDERS.find((p) => p.kind === kind);

  const handleAdd = async () => {
    if (kind === null) return;
    const value = account.trim();
    if (value.length < 6) {
      setFieldError("Enter a valid account or phone number.");
      return;
    }
    setFieldError(null);
    setConfirmError(null);
    try {
      await addMethod.mutateAsync({ kind, accountLabel: value });
      setStep("done");
    } catch (error) {
      setConfirmError(error instanceof Error ? error.message : "Could not add this method.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add payment method" className="max-w-md">
      {step === "provider" ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Choose where the money lives. You can add more methods later.
          </p>
          <ul className="flex flex-col gap-2" role="list">
            {PAYMENT_PROVIDERS.map((provider) => {
              const Icon = methodIconMap[provider.kind];
              const selectedTile = kind === provider.kind;
              return (
                <li key={provider.kind}>
                  <button
                    type="button"
                    aria-pressed={selectedTile}
                    className={cn(
                      PROVIDER_TILE_CLASSES,
                      selectedTile && PROVIDER_TILE_SELECTED_CLASSES,
                    )}
                    onClick={() => setKind(provider.kind)}
                  >
                    <span
                      className={cn(
                        "inline-flex size-10 shrink-0 items-center justify-center rounded-lg",
                        methodToneClasses[provider.kind],
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="size-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-text-primary">
                        {provider.label}
                      </span>
                      <span className="block truncate text-xs text-text-secondary">
                        {provider.hint}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep("details")} disabled={kind === null}>
              Continue
            </Button>
          </div>
        </div>
      ) : null}

      {step === "details" && selected ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-lg bg-surface-muted p-3">
            <span
              className={cn(
                "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                methodToneClasses[selected.kind],
              )}
              aria-hidden="true"
            >
              {(() => {
                const Icon = methodIconMap[selected.kind];
                return <Icon className="size-5" />;
              })()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-text-primary">
                {selected.label}
              </span>
              <span className="block truncate text-xs text-text-secondary">{selected.hint}</span>
            </span>
          </div>

          <Field
            id="wallet-method-account"
            label="Account or phone number"
            errorMessage={fieldError ?? undefined}
          >
            <Input
              id="wallet-method-account"
              placeholder={selected.hint}
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </Field>

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
              onClick={() => setStep("provider")}
              disabled={addMethod.isPending}
            >
              Back
            </Button>
            <Button onClick={handleAdd} disabled={addMethod.isPending}>
              {addMethod.isPending ? "Linking…" : "Add method"}
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
            {selected?.label} is linked and ready to use.
          </p>
          <Button className="mt-2 w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : null}
    </Modal>
  );
}

AddPaymentMethodDialog.displayName = "AddPaymentMethodDialog";
/** ################################ /COMPONENT ############################# */
