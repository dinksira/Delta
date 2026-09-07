/**
 * LeaveLiveDuelModal — confirmation gate before a participant leaves a live
 * duel. Fired by both the red leave button on the media control dock and the
 * "Leave Battle" button on the battle status sidebar; a destructive leave is
 * never performed without the participant explicitly confirming. Reuses the
 * token-based `Dialog` primitive and the theme `Button`.
 *
 * @example
 * ```tsx
 * <LeaveLiveDuelModal
 *   open={confirming}
 *   title={room.title}
 *   onClose={cancelLeave}
 *   onConfirm={leaveRoom}
 * />
 * ```
 */

"use client";

import { useEffect, useRef, type Ref } from "react";

import { LogOut } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";

export interface LeaveLiveDuelModalProps {
  open: boolean;
  /** Room title shown in the confirm copy so the user knows what they leave. */
  title?: string;
  /** Cancels the leave and keeps the participant in the room. */
  onClose: () => void;
  /** Confirms and leaves the duel (navigates the participant away). */
  onConfirm: () => void;
  className?: string;
}

interface ConfirmContentProps {
  title?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmRef: Ref<HTMLButtonElement>;
}

function ConfirmContent({
  title,
  onCancel,
  onConfirm,
  confirmRef,
}: Readonly<ConfirmContentProps>) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 px-6 py-5">
        <div className="flex size-12 items-center justify-center rounded-full bg-error-50 dark:bg-error-900/40">
          <LogOut className="size-6 text-error-600" aria-hidden />
        </div>
        <div>
          <h4 className="text-base font-bold text-text-primary">Leave this live duel?</h4>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            {title
              ? `You'll leave "${title}" and stop receiving live questions and updates. Your progress and leaderboard position are kept.`
              : "You'll leave this live duel and stop receiving live questions and updates. Your progress and leaderboard position are kept."}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
        <Button variant="ghost" onClick={onCancel}>
          Stay in duel
        </Button>
        <Button
          ref={confirmRef}
          variant="primary"
          size="lg"
          onClick={onConfirm}
          className="bg-error-600 hover:bg-error-700 focus-visible:ring-error-300 min-w-36"
        >
          Leave duel
        </Button>
      </div>
    </div>
  );
}

export function LeaveLiveDuelModal({
  open,
  title,
  onClose,
  onConfirm,
  className,
}: Readonly<LeaveLiveDuelModalProps>) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      confirmRef.current?.focus();
    }
  }, [open]);

  return (
    <Dialog isOpen={open} onClose={onClose} title="Leave Live Duel" size="sm" className={className}>
      <ConfirmContent
        title={title}
        onCancel={onClose}
        onConfirm={onConfirm}
        confirmRef={confirmRef}
      />
    </Dialog>
  );
}

export default LeaveLiveDuelModal;
