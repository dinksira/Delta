/**
 * ChampionshipStageConfirmModal — monetized confirmation gate before playing a
 * Championship stage. Like the Join Topic Battle confirmation, this recap
 * makes the entry cost and payout explicit before the player commits: points
 * at stake, ETB prize pool, and entry fee, plus the unlock contract (finish
 * the stage -> prize credited + next stage unlocks).
 *
 * Controlled by the host via `open`, `stage`, `onConfirm`, and `error`.
 *
 * @example
 * ```tsx
 * <ChampionshipStageConfirmModal
 *   open={Boolean(stage)}
 *   stage={stage}
 *   onClose={() => setStage(null)}
 *   onConfirm={(s) => router.push(`/features/competitions/championship/stages/${s.id}`)}
 * />
 * ```
 */

"use client";

import { useEffect, useRef } from "react";

import { Coins, Play, ShieldCheck, Star } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";
import { StatusBanner, type StatusBannerType } from "@/components/theme/StatusBanner";
import type { ChampionshipStage } from "@/modules/Competition/types/championship";

export interface ChampionshipStageConfirmModalProps {
  open: boolean;
  stage: ChampionshipStage | null;
  onClose: () => void;
  onConfirm: (stage: ChampionshipStage) => void;
  isSubmitting?: boolean;
  error?: string | null;
  className?: string;
}

const bannerTypeStyles: Record<StatusBannerType, string> = {
  success: "rounded-lg border border-success-500 bg-success-50 text-success-700",
  error: "rounded-lg border border-error-500 bg-error-50 text-error-700",
  info: "rounded-lg border border-info-500 bg-info-50 text-info-700",
};

function isPaid(entryFee: string): boolean {
  return entryFee.trim().toLowerCase() !== "free";
}

export function ChampionshipStageConfirmModal({
  open,
  stage,
  onClose,
  onConfirm,
  isSubmitting = false,
  error = null,
  className,
}: Readonly<ChampionshipStageConfirmModalProps>) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open || isSubmitting) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, isSubmitting, onClose]);

  useEffect(() => {
    if (open && !isSubmitting) {
      confirmRef.current?.focus();
    }
  }, [open, isSubmitting]);

  if (!stage) {
    return null;
  }

  const paid = isPaid(stage.entryFee);

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      title="Stage Entry"
      size="sm"
      className={className}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 px-6 py-5">
          <p className="text-sm text-text-secondary">
            {paid
              ? `You'll pay ${stage.entryFee} to enter ${stage.name}. Confirm to lock in your seat.`
              : `Confirm your entry to ${stage.name} — complete it to collect your payout.`}
          </p>

          <div className="rounded-2xl border border-border-default bg-surface-muted p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-full bg-primary-600 px-2.5 py-1 text-[11px] font-bold text-white">
                {stage.shortLabel}
              </span>
              <span className="text-sm font-semibold text-text-primary">{stage.name}</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-default p-3">
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  <Coins className="size-3.5" aria-hidden />
                  Entry
                </span>
                <span className="text-sm font-bold text-text-primary">{stage.entryFee}</span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-default p-3">
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  <Star className="size-3.5" aria-hidden />
                  Points
                </span>
                <span className="text-sm font-bold text-text-primary">
                  +{stage.pointsToEarn} pts
                </span>
              </div>
              <div className="flex flex-col gap-1 rounded-xl border border-border-subtle bg-surface-default p-3">
                <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                  <Coins className="size-3.5" aria-hidden />
                  Prize
                </span>
                <span className="text-sm font-bold text-success-600">{stage.prizePool}</span>
              </div>
            </div>
          </div>

          <p className="flex items-start gap-1.5 text-xs text-text-secondary">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden />
            Win the stage to credit your prize and {stage.pointsToEarn} pts, then the next stage
            unlocks. Once the stage is won, the payout is final and non-refundable.
          </p>

          {error ? <StatusBanner type="error" message={error} typeStyles={bannerTypeStyles} /> : null}
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Not now
          </Button>
          <Button
            ref={confirmRef}
            variant="primary"
            size="lg"
            onClick={() => onConfirm(stage)}
            disabled={isSubmitting}
            className="min-w-44"
          >
            <Play className="size-4" aria-hidden />
            {paid ? `Play for ${stage.entryFee}` : "Confirm & Play"}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

export default ChampionshipStageConfirmModal;