"use client";

import { X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { DialogOverlay } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import { fetchOrgMedia } from "@/modules/School/api";

function guessKind(fileName: string, url: string): "image" | "video" | "pdf" | "other" {
  const name = `${fileName} ${url}`.toLowerCase();
  if (/\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(name)) return "image";
  if (/\.(mp4|webm|ogg|mov|m4v)(\?|$)/i.test(name)) return "video";
  if (/\.pdf(\?|$)/i.test(name)) return "pdf";
  return "other";
}

/** In-app viewport for ghost requirement attachments (no download / new-tab dump). */
export function GhostRequirementPreviewDialog({
  open,
  orgId,
  mediaId,
  fileName,
  onClose,
}: Readonly<{
  open: boolean;
  orgId: string;
  mediaId: string;
  fileName: string;
  onClose: () => void;
}>) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !orgId || !mediaId) return;
    let cancelled = false;
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
  }, [open, orgId, mediaId]);

  const kind = useMemo(() => guessKind(fileName, url || ""), [fileName, url]);

  if (!open) return null;

  return createPortal(
    <>
      <DialogOverlay className="z-[4500]" onClose={onClose} />
      <div className="fixed inset-0 z-[4510] flex items-center justify-center p-4 sm:p-8">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Preview ${fileName}`}
          className="flex max-h-[min(92vh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-[#0f2a3d] shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
            <p className="min-w-0 truncate text-sm font-semibold text-white">{fileName}</p>
            <button
              type="button"
              className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close preview"
              onClick={onClose}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
          <div className="relative flex min-h-[16rem] flex-1 items-center justify-center overflow-auto bg-black/40 p-3 sm:p-5">
            {loading ? (
              <p className="text-sm text-white/70">Loading preview…</p>
            ) : error ? (
              <p className="text-sm text-red-300">{error}</p>
            ) : url && kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={url}
                alt={fileName}
                className="max-h-[min(78vh,48rem)] max-w-full object-contain"
              />
            ) : url && kind === "video" ? (
              <video
                src={url}
                controls
                className="max-h-[min(78vh,48rem)] max-w-full rounded-lg"
              >
                Your browser cannot play this video.
              </video>
            ) : url && kind === "pdf" ? (
              <iframe
                title={fileName}
                src={url}
                className="h-[min(78vh,48rem)] w-full rounded-lg bg-white"
              />
            ) : url ? (
              <iframe
                title={fileName}
                src={url}
                className="h-[min(78vh,48rem)] w-full rounded-lg bg-white"
              />
            ) : null}
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
