/**
 * JoinTopicBattleModal — confirmation gate before joining a topic battle.
 * Shows a read-only recap (BattleSummaryPanel), entry terms, inline errors, and
 * a confirm/cancel footer; swaps to a success view once the join succeeds.
 *
 * Controlled by the host via `open`, `battle`, `onConfirm`, `isSubmitting`,
 * `error`, and `success` (set when the join mutation succeeded for this battle).
 *
 * @example
 * ```tsx
 * <JoinTopicBattleModal
 *   open={Boolean(modal.battle)}
 *   battle={modal.battle}
 *   onClose={modal.close}
 *   onConfirm={modal.confirm}
 *   isSubmitting={modal.isSubmitting}
 *   error={modal.error}
 *   success={modal.isSuccess}
 *   onViewBattle={(id) => router.push(`/features/competitions/battles/${id}`)}
 * />
 * ```
 */

"use client";

import { useEffect, useRef, type Ref } from "react";

import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";
import { StatusBanner, type StatusBannerType } from "@/components/theme/StatusBanner";
import { BattleSummaryPanel } from "@/components/molecules/BattleSummaryPanel";
import type { TopicBattle } from "@/modules/Competition/types/topicBattle";

export interface JoinTopicBattleModalProps {
  open: boolean;
  battle: TopicBattle | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onViewBattle?: (id: string) => void;
  /** True while the join request is in flight; blocks dismissal. */
  isSubmitting?: boolean;
  error?: string | null;
  /** True once the join succeeded for this battle; shows the success view. */
  success?: boolean;
  /** True when the current user is anonymous; shows the guest note. */
  isGuest?: boolean;
  className?: string;
}

interface ConfirmContentProps {
  battle: TopicBattle;
  isFree: boolean;
  isGuest: boolean;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmRef: Ref<HTMLButtonElement>;
}

interface SuccessContentProps {
  battle: TopicBattle;
  onDone: () => void;
  onViewBattle?: (id: string) => void;
}

/** Banner tones reuse the theme StatusBanner; only error is rendered here today. */
const bannerTypeStyles: Record<StatusBannerType, string> = {
  success: "rounded-lg border border-success-500 bg-success-50 text-success-700",
  error: "rounded-lg border border-error-500 bg-error-50 text-error-700",
  info: "rounded-lg border border-info-500 bg-info-50 text-info-700",
};

function ConfirmContent({
  battle,
  isFree,
  isGuest,
  error,
  isSubmitting,
  onCancel,
  onConfirm,
  confirmRef,
}: Readonly<ConfirmContentProps>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 px-6 py-5">
        <p className="text-sm text-text-secondary">
          {isFree
            ? "Confirm your entry — you'll be matched with other players as seats fill."
            : `You'll pay ${battle.entryFee} to enter. Confirm to reserve your seat.`}
        </p>
        <BattleSummaryPanel battle={battle} />

        <p className="flex items-start gap-1.5 text-xs text-text-secondary">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden />
          By joining, you agree to the battle rules. Entry is non-refundable once the battle
          starts.
        </p>

        {isGuest ? (
          <p className="rounded-lg border border-warning-500 bg-warning-50 px-3 py-2 text-xs text-warning-700">
            You&apos;re joining as a guest — sign in to track results and earn XP.
          </p>
        ) : null}

        {error ? <StatusBanner type="error" message={error} typeStyles={bannerTypeStyles} /> : null}
      </div>

      <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
        <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
          Not now
        </Button>
        <Button
          ref={confirmRef}
          variant="primary"
          size="lg"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="min-w-40"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Joining…
            </>
          ) : isFree ? (
            "Confirm & Join"
          ) : (
            `Join for ${battle.entryFee}`
          )}
        </Button>
      </div>
    </div>
  );
}

function SuccessContent({ battle, onDone, onViewBattle }: Readonly<SuccessContentProps>) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success-50">
        <CheckCircle2 className="size-10 text-success-500" aria-hidden />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary">You&apos;re in!</h3>
        <p className="mt-1 text-sm text-text-secondary">
          {battle.title} · {battle.playersJoined}/{battle.playersMax} players
        </p>
      </div>
      <div className="mt-2 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone}>
          Done
        </Button>
        <Button variant="primary" onClick={() => onViewBattle?.(battle.id)}>
          View Battle
        </Button>
      </div>
    </div>
  );
}

export function JoinTopicBattleModal({
  open,
  battle,
  onClose,
  onConfirm,
  onViewBattle,
  isSubmitting = false,
  error = null,
  success = false,
  isGuest = false,
  className,
}: Readonly<JoinTopicBattleModalProps>) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const showSuccess = open && Boolean(battle) && success;

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (battle) {
      onConfirm(battle.id);
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

  if (!battle) {
    return null;
  }

  const isFree = battle.entryFee.trim().toLowerCase() === "free";

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      title={showSuccess ? undefined : "Join Topic Battle"}
      size="sm"
      className={className}
    >
      {showSuccess ? (
        <SuccessContent battle={battle} onDone={onClose} onViewBattle={onViewBattle} />
      ) : (
        <ConfirmContent
          battle={battle}
          isFree={isFree}
          isGuest={isGuest}
          error={error}
          isSubmitting={isSubmitting}
          onCancel={onClose}
          onConfirm={handleConfirm}
          confirmRef={confirmRef}
        />
      )}
    </Dialog>
  );
}

export default JoinTopicBattleModal;
