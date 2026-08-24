"use client";

import { useState } from "react";

import { Button, DialogOverlay, DialogPanel } from "@/components/theme";

export type GhostStatusNoteModalProps = Readonly<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  required?: boolean;
  pending?: boolean;
  confirmTone?: "primary" | "danger";
  onCancel: () => void;
  onConfirm: (note: string) => void;
}>;

/** In-app note dialog (replaces window.prompt for ghost status / review). */
export function GhostStatusNoteModal({
  open,
  title,
  description,
  confirmLabel,
  required = false,
  pending = false,
  confirmTone = "primary",
  onCancel,
  onConfirm,
}: GhostStatusNoteModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  return (
    <>
      <DialogOverlay
        onClose={() => {
          if (!pending) {
            setNote("");
            setError(null);
            onCancel();
          }
        }}
      />
      <div className="fixed inset-0 z-[4800] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          <p className="mt-2 text-sm text-text-secondary">{description}</p>
          <textarea
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              setError(null);
            }}
            rows={4}
            disabled={pending}
            autoFocus
            placeholder={required ? "Required" : "Optional"}
            className="mt-4 w-full rounded-lg border border-border-default px-3 py-2 text-sm outline-none focus:border-primary-500"
          />
          {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setNote("");
                setError(null);
                onCancel();
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={pending}
              className={confirmTone === "danger" ? "bg-error-600 text-white hover:bg-error-700" : undefined}
              onClick={() => {
                const trimmed = note.trim();
                if (required && !trimmed) {
                  setError("A reason is required.");
                  return;
                }
                onConfirm(trimmed);
              }}
            >
              {pending ? "Please wait…" : confirmLabel}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>
  );
}
