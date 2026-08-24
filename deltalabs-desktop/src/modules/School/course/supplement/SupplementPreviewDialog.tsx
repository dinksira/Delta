"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { DialogOverlay } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import { fetchOrgMedia, type CourseSupplementKind } from "@/modules/School/api";

function resolvePreviewKind(
  kind: CourseSupplementKind | undefined,
  fileName: string,
  contentType: string,
  url: string,
): "image" | "video" | "audio" | "pdf" | "slides" | "other" {
  if (kind === "video") return "video";
  if (kind === "audio") return "audio";
  if (kind === "pdf") return "pdf";
  if (kind === "slides") return "slides";
  const blob = `${contentType} ${fileName} ${url}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(blob) || contentType.startsWith("image/")) {
    return "image";
  }
  if (contentType.startsWith("video/") || /\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(blob)) return "video";
  if (contentType.startsWith("audio/") || /\.(mp3|wav|m4a|aac|flac)(\?|$)/i.test(blob)) return "audio";
  if (/\.pdf(\?|$)/i.test(blob) || contentType.includes("pdf")) return "pdf";
  if (/\.(ppt|pptx|key|odp)(\?|$)/i.test(blob)) return "slides";
  return "other";
}

/** In-app preview for supplements: video, audio, PDF, images; slides/other via iframe/open. */
export function SupplementPreviewDialog({
  open,
  orgId,
  title,
  kind,
  mediaId,
  playbackUrl,
  linkUrl,
  fileName,
  contentType,
  onClose,
}: Readonly<{
  open: boolean;
  orgId: string;
  title: string;
  kind?: CourseSupplementKind;
  mediaId?: string | null;
  playbackUrl?: string;
  linkUrl?: string;
  fileName?: string;
  contentType?: string;
  onClose: () => void;
}>) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const direct = (playbackUrl || linkUrl || "").trim();
    if (direct) {
      setUrl(direct);
      setError(null);
      setLoading(false);
      return;
    }
    if (!mediaId) {
      setUrl(null);
      setError("No preview URL for this file.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    setUrl(null);
    void fetchOrgMedia(orgId, mediaId)
      .then((asset) => {
        if (cancelled) return;
        const next =
          asset.playbackUrl ||
          asset.playback_url ||
          asset.hlsUrl ||
          asset.hls_url ||
          null;
        if (!next) {
          setError("No preview URL for this file.");
          return;
        }
        setUrl(next);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : "Could not load preview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orgId, mediaId, playbackUrl, linkUrl]);

  const previewKind = useMemo(
    () => resolvePreviewKind(kind, fileName || "", contentType || "", url || ""),
    [kind, fileName, contentType, url],
  );

  if (!open) return null;

  return createPortal(
    <>
      <DialogOverlay className="z-[4500]" onClose={onClose} />
      <div className="fixed inset-0 z-[4510] flex items-center justify-center p-4 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title || "Supplement preview"}
          className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border-default bg-white shadow-xl"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border-default px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-text-primary">{title || "Preview"}</p>
              <p className="text-[11px] uppercase tracking-wide text-text-secondary">
                {previewKind}
              </p>
            </div>
            <button
              type="button"
              className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary hover:bg-surface-muted"
              aria-label="Close"
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="min-h-[16rem] flex-1 bg-[#0f2a3d]/5 p-3 sm:p-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
                Loading preview…
              </div>
            ) : error ? (
              <div className="flex h-64 items-center justify-center text-sm text-red-600">{error}</div>
            ) : !url ? (
              <div className="flex h-64 items-center justify-center text-sm text-text-secondary">
                Nothing to preview.
              </div>
            ) : previewKind === "video" ? (
              <video src={url} controls className="mx-auto max-h-[70vh] w-full rounded-lg bg-black" />
            ) : previewKind === "audio" ? (
              <div className="flex h-64 flex-col items-center justify-center gap-4">
                <p className="text-sm text-text-secondary">{fileName || title}</p>
                <audio src={url} controls className="w-full max-w-lg" />
              </div>
            ) : previewKind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt="" className="mx-auto max-h-[70vh] rounded-lg object-contain" />
            ) : previewKind === "pdf" || previewKind === "slides" || previewKind === "other" ? (
              <iframe title={title || "Preview"} src={url} className="h-[70vh] w-full rounded-lg bg-white" />
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
