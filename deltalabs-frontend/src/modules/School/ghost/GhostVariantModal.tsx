"use client";

import { GitFork, X } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay } from "@/components/theme";
import type { GhostImplementationType } from "@/modules/School/api";
import { ImplementationTypeSelect } from "@/modules/School/ghost/ImplementationTypeSelect";

/** Centered Variant modal — exact Figma layout (name + Same/Branch Base). */
export function GhostVariantModal({
  busy,
  error,
  onClose,
  onSave,
}: Readonly<{
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    implementationType: GhostImplementationType;
  }) => void;
}>) {
  const [name, setName] = useState("V1 Video");
  const [implementationType, setImplementationType] =
    useState<GhostImplementationType>("same_base");

  return createPortal(
    <>
      <DialogOverlay
        onClose={() => !busy && onClose()}
        className="z-[1600] bg-slate-950/35 backdrop-blur-[2px]"
      />
      <div className="fixed inset-0 z-[1610] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="ghost-variant-title"
          className="w-full max-w-[26rem] rounded-2xl border border-border-default bg-white p-5 shadow-xl"
        >
          <div className="mb-5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e8eef2] text-primary-800">
                <GitFork className="size-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h2 id="ghost-variant-title" className="text-lg font-bold text-[#0f2a3d]">
                Variant
              </h2>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="inline-flex size-8 items-center justify-center rounded-md text-[#5a6b7a] hover:bg-surface-muted"
              aria-label="Close"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-[#0f2a3d]">Variant Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={busy}
              className="w-full rounded-xl border border-[#c5d0da] bg-white px-3 py-2.5 text-sm text-[#0f2a3d] outline-none focus:border-primary-500"
            />
          </label>

          <label className="mt-4 block space-y-1.5">
            <span className="text-sm font-medium text-[#0f2a3d]">Implementation Type</span>
            <ImplementationTypeSelect
              value={implementationType}
              disabled={busy}
              onChange={setImplementationType}
              className="w-full [&>button]:w-full"
            />
          </label>

          {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={busy || !name.trim()}
              onClick={() => onSave({ name: name.trim(), implementationType })}
            >
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
