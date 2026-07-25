"use client";

import { FilePlus2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay } from "@/components/theme";
import { uploadSchoolMediaFile } from "@/modules/School/api";

export type CreateExerciseModalPayload = Readonly<{
  title: string;
  timeTaken: string;
  totalQuestions: number;
  coverImageUrl: string;
}>;

/** Figma: create exercise modal — cover upload + title / time / total questions. */
export function CreateExerciseModal({
  open,
  orgId,
  kind,
  busy,
  error,
  onClose,
  onSave,
}: Readonly<{
  open: boolean;
  orgId: string;
  kind: "exercise" | "test";
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: CreateExerciseModalPayload) => void;
}>) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [timeTaken, setTimeTaken] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setTimeTaken("");
    setTotalQuestions("");
    setCoverPreview(null);
    setCoverImageUrl("");
    setLocalError(null);
    setUploading(false);
  }, [open, kind]);

  if (!open || typeof document === "undefined") return null;

  const heading = kind === "test" ? "create test" : "create exercise";
  const titlePlaceholder = kind === "test" ? "Test" : "Exercise";
  // Cover is optional — never block Save on upload. Busy only while create is in flight.
  const canSave = title.trim().length > 0 && !busy;

  const onPickCover = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLocalError("Cover must be an image file.");
      return;
    }
    setLocalError(null);
    const preview = URL.createObjectURL(file);
    setCoverPreview(preview);
    setCoverImageUrl("");
    setUploading(true);
    try {
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: "Exercise cover",
        visibility: "org",
        publishToFeed: false,
      });
      setCoverImageUrl(uploaded.playbackUrl || "");
      if (!uploaded.playbackUrl) {
        setLocalError("Cover uploaded, but no preview URL yet. Try another image or Save without cover.");
      }
    } catch (err) {
      setCoverPreview(null);
      setCoverImageUrl("");
      setLocalError(err instanceof Error ? err.message : "Could not upload cover.");
    } finally {
      setUploading(false);
    }
  };

  return createPortal(
    <>
      <DialogOverlay className="z-[4500]" onClose={() => (busy || uploading ? null : onClose())} />
      <div className="fixed inset-0 z-[4510] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={heading}
          className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-4">
            <h2 className="text-sm font-medium lowercase text-[#5a7184]">{heading}</h2>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-md text-[#0f2a3d] hover:bg-surface-muted"
              aria-label="Close"
              disabled={busy || uploading}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <button
              type="button"
              disabled={busy || uploading}
              className="relative flex h-36 w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-[#c5d0da] bg-[#f7fafc] transition-colors hover:bg-[#eef3f6] disabled:opacity-60"
              onClick={() => fileRef.current?.click()}
            >
              {coverPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverPreview} alt="" className="absolute inset-0 size-full object-cover" />
              ) : (
                <>
                  <FilePlus2 className="size-7 text-[#8a9aab]" strokeWidth={1.5} aria-hidden />
                  <span className="mt-2 text-sm text-[#8a9aab]">Click to Upload Cover Image</span>
                </>
              )}
              {uploading ? (
                <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-sm font-medium text-white">
                  Uploading cover…
                </span>
              ) : null}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void onPickCover(e.target.files?.[0] ?? null)}
            />

            <input
              value={title}
              placeholder={titlePlaceholder}
              disabled={busy}
              className="h-11 w-full rounded-xl border border-[#c5d0da] px-3.5 text-sm text-[#0f2a3d] outline-none placeholder:text-[#8a9aab] focus:border-primary-500"
              onChange={(e) => setTitle(e.target.value)}
            />
            <input
              value={timeTaken}
              placeholder="Time taken"
              disabled={busy}
              className="h-11 w-full rounded-xl border border-[#c5d0da] px-3.5 text-sm text-[#0f2a3d] outline-none placeholder:text-[#8a9aab] focus:border-primary-500"
              onChange={(e) => setTimeTaken(e.target.value)}
            />
            <input
              value={totalQuestions}
              placeholder="Total question"
              inputMode="numeric"
              disabled={busy}
              className="h-11 w-full rounded-xl border border-[#c5d0da] px-3.5 text-sm text-[#0f2a3d] outline-none placeholder:text-[#8a9aab] focus:border-primary-500"
              onChange={(e) => setTotalQuestions(e.target.value)}
            />

            {localError || error ? (
              <p className="text-sm text-red-600">{localError || error}</p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-3 px-5 pb-5">
            <Button type="button" variant="secondary" size="md" disabled={busy || uploading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={!canSave}
              onClick={() => {
                if (uploading) {
                  setLocalError("Cover is still uploading — wait a moment, or Save without cover.");
                  return;
                }
                setLocalError(null);
                onSave({
                  title: title.trim(),
                  timeTaken: timeTaken.trim(),
                  totalQuestions: Number(totalQuestions) || 0,
                  coverImageUrl,
                });
              }}
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
