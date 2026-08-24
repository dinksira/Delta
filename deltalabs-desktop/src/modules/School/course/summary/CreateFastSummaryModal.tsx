"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import {
  Button,
  DialogHeader,
  DialogOverlay,
  DialogPanel,
  Input,
  Select,
} from "@/components/theme";

export type CreateFastSummaryModalPayload = Readonly<{
  title: string;
  summaryType: string;
  section: string;
  layout: "stack" | "split";
}>;

/** Fast Summary Detail — Delta Labs dialog primitives. Layout is stored and applied in the composer. */
export function CreateFastSummaryModal({
  open,
  busy,
  error,
  onClose,
  onStart,
}: Readonly<{
  open: boolean;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onStart: (payload: CreateFastSummaryModalPayload) => void;
}>) {
  const [title, setTitle] = useState("");
  const [summaryType, setSummaryType] = useState("academic");
  const [section, setSection] = useState("chapter_one");
  const [layout, setLayout] = useState<"stack" | "split">("stack");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setSummaryType("academic");
    setSection("chapter_one");
    setLayout("stack");
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const canStart = title.trim().length > 0 && !busy;

  return createPortal(
    <>
      <DialogOverlay
        className="z-[4500]"
        onClose={() => (busy ? null : onClose())}
      />
      <div className="fixed inset-0 z-[4510] flex items-center justify-center p-4">
        <DialogPanel
          role="dialog"
          aria-modal="true"
          aria-labelledby="fast-summary-detail-title"
          className="w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <DialogHeader className="flex items-center justify-between px-5 py-3.5">
            <h2 id="fast-summary-detail-title" className="text-sm font-semibold text-text-primary">
              Fast Summary Detail
            </h2>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
              aria-label="Close"
              disabled={busy}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </DialogHeader>

          <div className="space-y-4 px-5 py-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Title</span>
              <Input
                value={title}
                placeholder="Title"
                disabled={busy}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Summary Type</span>
              <Select
                value={summaryType}
                disabled={busy}
                onChange={(e) => setSummaryType(e.target.value)}
              >
                <option value="academic">Academic</option>
                <option value="brief">Brief</option>
                <option value="study_guide">Study guide</option>
              </Select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Section</span>
              <Select
                value={section}
                disabled={busy}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="chapter_one">Chapter One</option>
                <option value="chapter_two">Chapter Two</option>
                <option value="overview">Overview</option>
                <option value="review">Review</option>
              </Select>
            </label>
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Layout</span>
              <p className="text-[11px] text-text-secondary">
                Chooses how the composer canvas is arranged (stack vs header + columns).
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  aria-pressed={layout === "stack"}
                  aria-label="Stacked layout"
                  disabled={busy}
                  className={[
                    "flex h-16 flex-1 flex-col justify-center gap-1.5 rounded-md border bg-surface-default px-3 transition-colors",
                    layout === "stack"
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-border-default hover:border-primary-300",
                  ].join(" ")}
                  onClick={() => setLayout("stack")}
                >
                  <span className="h-2 rounded bg-surface-muted" />
                  <span className="h-2 rounded bg-surface-muted" />
                </button>
                <button
                  type="button"
                  aria-pressed={layout === "split"}
                  aria-label="Split layout"
                  disabled={busy}
                  className={[
                    "flex h-16 flex-1 flex-col justify-center gap-1.5 rounded-md border bg-surface-default px-3 transition-colors",
                    layout === "split"
                      ? "border-primary-500 ring-2 ring-primary-200"
                      : "border-border-default hover:border-primary-300",
                  ].join(" ")}
                  onClick={() => setLayout("split")}
                >
                  <span className="h-2 rounded bg-surface-muted" />
                  <span className="flex gap-1.5">
                    <span className="h-6 flex-1 rounded bg-surface-muted" />
                    <span className="h-6 flex-1 rounded bg-surface-muted" />
                  </span>
                </button>
              </div>
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-default px-5 py-3.5">
            <Button type="button" variant="secondary" size="md" disabled={busy} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!canStart}
              onClick={() =>
                onStart({
                  title: title.trim(),
                  summaryType,
                  section,
                  layout,
                })
              }
            >
              {busy ? "Starting…" : "Start"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}
