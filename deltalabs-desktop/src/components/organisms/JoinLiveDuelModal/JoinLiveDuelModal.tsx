/**
 * JoinLiveDuelModal — confirmation gate before joining a live duel, mirroring
 * `JoinTopicBattleModal` so the flow feels identical. Shows a read-only recap,
 * entry terms, inline errors, and a confirm/cancel footer; swaps to a success
 * view once the join succeeds, then "Enter Duel" drops the user into the room.
 *
 * @example
 * ```tsx
 * <JoinLiveDuelModal
 *   open={Boolean(modal.duel)}
 *   duel={modal.duel}
 *   onClose={modal.close}
 *   onConfirm={modal.confirm}
 *   onEnterDuel={(id) => router.push(`/features/competitions/live-duels/${id}`)}
 *   isSubmitting={modal.isSubmitting}
 *   error={modal.error}
 *   success={modal.isSuccess}
 * />
 * ```
 */

"use client";

import { useEffect, useRef, type Ref } from "react";

import { CheckCircle2, Eye, Loader2, ShieldCheck, Trophy, Users } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";
import { StatusBanner, type StatusBannerType } from "@/components/theme/StatusBanner";
import { Avatar } from "@/components/atoms/Avatar/Avatar";
import type { LiveDuelEntry } from "@/modules/Competition/types/liveDuel";

export interface JoinLiveDuelModalProps {
  open: boolean;
  duel: LiveDuelEntry | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  onEnterDuel?: (id: string) => void;
  /** True while the join request is in flight; blocks dismissal. */
  isSubmitting?: boolean;
  error?: string | null;
  /** True once the join succeeded for this duel; shows the success view. */
  success?: boolean;
  /** True when the current user is anonymous; shows the guest note. */
  isGuest?: boolean;
  className?: string;
}

interface RecapContent {
  duel: LiveDuelEntry;
  isFree: boolean;
}

function RecapCard({ duel, isFree }: Readonly<RecapContent>) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-default p-4">
      <div className="mb-3 flex items-center gap-3">
        <Avatar name={duel.hostName} src={duel.hostAvatarUrl} size="md" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-text-primary">{duel.title}</p>
          <p className="text-xs text-text-secondary">
            hosted by {duel.hostName} · {duel.subject} · {duel.difficulty}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-3 divide-x divide-border-default rounded-xl bg-surface-muted py-2.5 text-center">
        <div className="flex flex-col items-center gap-0.5 px-1">
          <p className="flex items-center gap-1 text-sm font-bold tabular-nums text-text-primary">
            <Users className="size-3.5 text-text-tertiary" aria-hidden />
            {duel.playersJoined}/{duel.playersMax}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Players</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-1">
          <p className="flex items-center gap-1 text-sm font-bold tabular-nums text-text-primary">
            <Eye className="size-3.5 text-text-tertiary" aria-hidden />
            {duel.viewers.toLocaleString()}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Watching</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 px-1">
          <p className="flex items-center gap-1 text-sm font-bold text-primary-700 dark:text-primary-300">
            <Trophy className="size-3.5 text-warning-500" aria-hidden />
            {isFree ? "Free" : duel.entryFee}
          </p>
          <p className="text-[10px] uppercase tracking-wide text-text-secondary">Entry</p>
        </div>
      </div>
    </div>
  );
}

/** Banner tones reuse the theme StatusBanner; only error is rendered here today. */
const bannerTypeStyles: Record<StatusBannerType, string> = {
  success: "rounded-lg border border-success-500 bg-success-50 text-success-700",
  error: "rounded-lg border border-error-500 bg-error-50 text-error-700",
  info: "rounded-lg border border-info-500 bg-info-50 text-info-700",
};

interface ConfirmContentProps {
  duel: LiveDuelEntry;
  isFree: boolean;
  isGuest: boolean;
  error: string | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  confirmRef: Ref<HTMLButtonElement>;
}

interface SuccessContentProps {
  duel: LiveDuelEntry;
  onDone: () => void;
  onEnterDuel?: (id: string) => void;
}

function ConfirmContent({
  duel,
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
            ? "Confirm your entry — you'll join the stage as the host posts questions live."
            : `You'll pay ${duel.entryFee} to enter. Confirm to reserve your spot on stage.`}
        </p>
        <RecapCard duel={duel} isFree={isFree} />

        <p className="flex items-start gap-1.5 text-xs text-text-secondary">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-text-tertiary" aria-hidden />
          By joining, you agree to the duel rules. Entry is non-refundable once the duel
          begins.
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
            `Join for ${duel.entryFee}`
          )}
        </Button>
      </div>
    </div>
  );
}

function SuccessContent({ duel, onDone, onEnterDuel }: Readonly<SuccessContentProps>) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success-50">
        <CheckCircle2 className="size-10 text-success-500" aria-hidden />
      </div>
      <div>
        <h3 className="text-lg font-bold text-text-primary">You&apos;re on stage!</h3>
        <p className="mt-1 text-sm text-text-secondary">
          {duel.title} · hosted by {duel.hostName}
        </p>
      </div>
      <div className="mt-2 flex w-full flex-col-reverse items-stretch gap-3 sm:flex-row sm:justify-end">
        <Button variant="ghost" onClick={onDone}>
          Done
        </Button>
        <Button variant="primary" onClick={() => onEnterDuel?.(duel.id)}>
          Enter Duel
        </Button>
      </div>
    </div>
  );
}

export function JoinLiveDuelModal({
  open,
  duel,
  onClose,
  onConfirm,
  onEnterDuel,
  isSubmitting = false,
  error = null,
  success = false,
  isGuest = false,
  className,
}: Readonly<JoinLiveDuelModalProps>) {
  const confirmRef = useRef<HTMLButtonElement>(null);
  const showSuccess = open && Boolean(duel) && success;

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleConfirm = () => {
    if (duel) {
      onConfirm(duel.id);
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

  if (!duel) {
    return null;
  }

  const isFree = duel.entryFee.trim().toLowerCase() === "free";

  return (
    <Dialog
      isOpen={open}
      onClose={handleClose}
      title={showSuccess ? undefined : "Join Live Duel"}
      size="sm"
      className={className}
    >
      {showSuccess ? (
        <SuccessContent duel={duel} onDone={onClose} onEnterDuel={onEnterDuel} />
      ) : (
        <ConfirmContent
          duel={duel}
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

export default JoinLiveDuelModal;