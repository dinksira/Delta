"use client";

import { Ghost, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay, Input, Textarea } from "@/components/theme";
import { uploadSchoolMediaFile, type CourseSupplementKind } from "@/modules/School/api";

export type UploadSupplementPayload = Readonly<{
  title: string;
  description: string;
  source: "upload" | "link";
  kind?: CourseSupplementKind;
  mediaId?: string | null;
  playbackUrl: string;
  linkUrl: string;
  contentType: string;
  fileName: string;
}>;

function inferKind(file: File): CourseSupplementKind | undefined {
  const t = file.type.toLowerCase();
  const n = file.name.toLowerCase();
  if (t.includes("pdf") || n.endsWith(".pdf")) return "pdf";
  if (
    t.includes("presentation") ||
    n.endsWith(".ppt") ||
    n.endsWith(".pptx") ||
    n.endsWith(".key") ||
    n.endsWith(".odp")
  ) {
    return "slides";
  }
  if (t.startsWith("video/")) return "video";
  if (t.startsWith("audio/")) return "audio";
  return "other";
}

/** Figma Upload File modal — upload or link course supplement. */
export function UploadSupplementModal({
  open,
  orgId,
  busy,
  error,
  onClose,
  onUpload,
}: Readonly<{
  open: boolean;
  orgId: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onUpload: (payload: UploadSupplementPayload) => void;
}>) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tab, setTab] = useState<"upload" | "link">("upload");
  const [linkUrl, setLinkUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [contentType, setContentType] = useState("");
  const [mediaId, setMediaId] = useState<string | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState("");
  const [kind, setKind] = useState<CourseSupplementKind | undefined>();
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setDescription("");
    setTab("upload");
    setLinkUrl("");
    setFileName("");
    setContentType("");
    setMediaId(null);
    setPlaybackUrl("");
    setKind(undefined);
    setLocalError(null);
    setUploading(false);
  }, [open]);

  if (!open || typeof document === "undefined") return null;

  const canSubmit =
    title.trim().length > 0 &&
    !busy &&
    !uploading &&
    (tab === "link" ? linkUrl.trim().length > 0 : Boolean(mediaId || playbackUrl));

  const onPickFile = async (file: File | null) => {
    if (!file) return;
    setLocalError(null);
    setFileName(file.name);
    setContentType(file.type || "");
    setKind(inferKind(file));
    setUploading(true);
    try {
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: title.trim() || file.name,
        visibility: "org",
        publishToFeed: false,
      });
      setMediaId(uploaded.mediaId);
      setPlaybackUrl(uploaded.playbackUrl || "");
      if (!uploaded.playbackUrl && !uploaded.mediaId) {
        setLocalError("Upload finished but no playback URL was returned.");
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Upload failed.");
      setMediaId(null);
      setPlaybackUrl("");
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
          aria-labelledby="upload-supplement-title"
          className="w-full max-w-lg overflow-hidden rounded-2xl border border-border-default bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border-default px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-10 items-center justify-center rounded-full bg-[#e8eef2] text-primary-800">
                <Ghost className="size-5" strokeWidth={1.6} aria-hidden />
              </span>
              <div>
                <h2 id="upload-supplement-title" className="text-sm font-semibold text-text-primary">
                  Upload File
                </h2>
                <p className="text-xs text-text-secondary">select File To Upload</p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-muted"
              aria-label="Close"
              disabled={busy || uploading}
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 px-5 py-4">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Name</span>
              <Input
                value={title}
                placeholder="eg. What is Newton's 2nd Law"
                disabled={busy || uploading}
                onChange={(e) => setTitle(e.target.value)}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-text-secondary">Description</span>
              <Textarea
                value={description}
                rows={3}
                placeholder="eg. What is Newton's 2nd Law"
                disabled={busy || uploading}
                onChange={(e) => setDescription(e.target.value)}
              />
            </label>

            <div className="flex gap-4 border-b border-border-default">
              {(
                [
                  ["upload", "Upload File"],
                  ["link", "Link"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={[
                    "relative pb-2 text-sm font-medium",
                    tab === id ? "text-primary-800" : "text-text-secondary",
                  ].join(" ")}
                  onClick={() => setTab(id)}
                >
                  {label}
                  {tab === id ? (
                    <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-800" />
                  ) : null}
                </button>
              ))}
            </div>

            {tab === "upload" ? (
              <div className="relative rounded-xl border border-dashed border-[#c5d0da] bg-[#f7fafc] px-4 py-10 text-center">
                <Ghost
                  className="absolute right-3 top-3 size-4 text-[#9aafbe]"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <Upload className="mx-auto size-8 text-primary-800" strokeWidth={1.5} aria-hidden />
                <p className="mt-3 text-sm text-text-secondary">
                  Drag and Drop or{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary-800 underline"
                    disabled={busy || uploading}
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose File
                  </button>{" "}
                  to add your requirement file
                </p>
                {fileName ? (
                  <p className="mt-2 text-xs font-medium text-text-primary">
                    {uploading ? "Uploading…" : fileName}
                  </p>
                ) : null}
                <input
                  ref={fileRef}
                  type="file"
                  className="hidden"
                  accept="application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,video/*,audio/*,image/*,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,.zip"
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                />
              </div>
            ) : (
              <label className="block space-y-1.5">
                <span className="text-xs font-medium text-text-secondary">URL</span>
                <Input
                  value={linkUrl}
                  placeholder="https://"
                  disabled={busy || uploading}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </label>
            )}

            {localError || error ? (
              <p className="text-sm text-red-600">{localError || error}</p>
            ) : null}
          </div>

          <div className="flex justify-end gap-2 border-t border-border-default px-5 py-3">
            <Button type="button" variant="secondary" size="sm" disabled={busy || uploading} onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={!canSubmit}
              onClick={() =>
                onUpload({
                  title: title.trim(),
                  description: description.trim(),
                  source: tab,
                  kind,
                  mediaId,
                  playbackUrl: tab === "upload" ? playbackUrl : linkUrl.trim(),
                  linkUrl: tab === "link" ? linkUrl.trim() : "",
                  contentType,
                  fileName: tab === "upload" ? fileName : linkUrl.trim(),
                })
              }
            >
              Upload
            </Button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
