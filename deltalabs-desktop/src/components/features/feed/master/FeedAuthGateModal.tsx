"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for the unauthenticated-action guard modal on feed surfaces. */
type FeedAuthGateModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  onLogin: () => void;
  onSignup: () => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** TikTok-like auth gate: blocks engagement actions until user logs in. */
export function FeedAuthGateModal({ open, onClose, onLogin, onSignup }: FeedAuthGateModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Login required"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border-default bg-surface-default p-5 shadow-md">
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
            aria-label="Close login prompt"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <h2 className="text-center text-2xl font-bold tracking-tight text-text-primary">Log in to continue</h2>
        <p className="mt-2 text-center text-sm text-text-secondary">
          You need an account to like, comment, save, share, and enroll from the feed.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onLogin}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            Log in
          </button>
          <button
            type="button"
            onClick={onSignup}
            className="inline-flex h-11 items-center justify-center rounded-md border border-border-default px-4 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted"
          >
            Sign up
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
/** ################################ /COMPONENT ############################# */
