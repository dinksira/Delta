"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  fetchSchoolGhost,
  reviewSchoolGhostVariant,
  submitSchoolGhostVariant,
  updateSchoolGhostVariant,
  uploadSchoolMediaFile,
  type GhostNodeDto,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export type GhostUploadWorkSheetProps = Readonly<{
  open: boolean;
  orgId: string;
  schoolId: string;
  ghostId: string;
  variantId: string;
  canReview?: boolean;
  onClose: () => void;
}>;

function mediaFromHead(node: GhostNodeDto | null): {
  mediaId: string;
  fileName: string;
  previewUrl: string;
} | null {
  if (!node) return null;
  const head = node.workingHead ?? {};
  const mediaId =
    typeof head.mediaId === "string"
      ? head.mediaId.trim()
      : typeof head.media_id === "string"
        ? head.media_id.trim()
        : "";
  const fileName =
    typeof head.fileName === "string"
      ? head.fileName.trim()
      : typeof head.file_name === "string"
        ? head.file_name.trim()
        : "Deliverable";
  const previewUrl =
    typeof head.previewUrl === "string"
      ? head.previewUrl.trim()
      : typeof head.playbackUrl === "string"
        ? head.playbackUrl.trim()
        : typeof head.referenceUrl === "string"
          ? head.referenceUrl.trim()
          : "";
  if (!mediaId && !previewUrl) return null;
  return { mediaId, fileName, previewUrl };
}

/**
 * Work surface for simple/external ghost nodes (image, file, …):
 * upload → preview → request approval. Reviewer can approve/reject here too.
 */
export function GhostUploadWorkSheet({
  open,
  orgId,
  schoolId,
  ghostId,
  variantId,
  canReview = false,
  onClose,
}: GhostUploadWorkSheetProps) {
  const queryClient = useQueryClient();
  const [note, setNote] = useState("");
  const [localPreview, setLocalPreview] = useState<{
    mediaId: string;
    fileName: string;
    previewUrl: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ghostQuery = useQuery({
    queryKey: schoolQueryKeys.ghost(orgId, schoolId, ghostId),
    queryFn: () => fetchSchoolGhost(orgId, schoolId, ghostId),
    enabled: open && Boolean(ghostId),
  });

  const node = ghostQuery.data?.nodes.find((n) => n.id === variantId) ?? null;
  const saved = mediaFromHead(node);
  const deliverable = localPreview ?? saved;
  const status = node?.status ?? "open";
  const blocked = Boolean(node?.blocked);
  const canSubmitWork =
    !blocked && status !== "submitted" && status !== "approved" && status !== "merged";

  useEffect(() => {
    if (!open) {
      setNote("");
      setLocalPreview(null);
      setError(null);
    }
  }, [open]);

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.ghost(orgId, schoolId, ghostId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId],
    });
  };

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: `Ghost deliverable — ${file.name}`,
        visibility: "org",
        publishToFeed: false,
      });
      const previewUrl = uploaded.playbackUrl || uploaded.referenceUrl || "";
      await updateSchoolGhostVariant(orgId, schoolId, ghostId, variantId, {
        mediaId: uploaded.mediaId,
        fileName: file.name,
        previewUrl,
        status: "in_progress",
      });
      return {
        mediaId: uploaded.mediaId,
        fileName: file.name,
        previewUrl,
      };
    },
    onSuccess: async (data) => {
      setLocalPreview(data);
      setError(null);
      await invalidate();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not upload file.");
    },
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!deliverable?.mediaId) {
        throw new Error("Upload an image (or file) before requesting approval.");
      }
      return submitSchoolGhostVariant(orgId, schoolId, ghostId, variantId, {
        note: note.trim(),
        outputRefs: [
          {
            contentType: "media_asset",
            mediaId: deliverable.mediaId,
            fileName: deliverable.fileName,
            previewUrl: deliverable.previewUrl,
          },
        ],
      });
    },
    onSuccess: async () => {
      setError(null);
      await invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not submit for approval.");
    },
  });

  const reviewMutation = useMutation({
    mutationFn: (decision: "approve" | "reject") =>
      reviewSchoolGhostVariant(orgId, schoolId, ghostId, variantId, {
        decision,
        note: note.trim(),
      }),
    onSuccess: async () => {
      setError(null);
      await invalidate();
      onClose();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not complete review.");
    },
  });

  if (!open) return null;

  const busy =
    uploadMutation.isPending || submitMutation.isPending || reviewMutation.isPending;

  return createPortal(
    <>
      <DialogOverlay onClose={() => !busy && onClose()} />
      <div className="fixed inset-0 z-[4700] flex items-center justify-center p-4">
        <DialogPanel
          className="flex max-h-[min(40rem,90vh)] w-full max-w-lg flex-col overflow-hidden p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-3 border-b border-border-default px-5 py-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-text-primary">
                {node?.name || "Variant work"}
              </h3>
              <p className="mt-1 text-xs text-text-tertiary">
                Upload the real deliverable (image, PDF, …). The reviewer opens this same sheet to
                preview, then approve or reject.
              </p>
            </div>
            <button
              type="button"
              className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
              disabled={busy}
              onClick={onClose}
              aria-label="Close"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {blocked ? (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                This node is blocked until upstream chain links are approved. If this image should
                be produced <span className="font-semibold">before</span> the exercise, reverse the
                Chain arrow so the image points <span className="font-semibold">to</span> the
                exercise (image → exercise), not the other way around.
              </p>
            ) : null}

            <div className="overflow-hidden rounded-xl border border-dashed border-border-default bg-surface-muted/30">
              {deliverable?.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={deliverable.previewUrl}
                  alt={deliverable.fileName}
                  className="max-h-64 w-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-text-tertiary">
                  <ImagePlus className="size-10" strokeWidth={1.4} aria-hidden />
                  <p className="text-sm">No file yet</p>
                </div>
              )}
            </div>

            {deliverable ? (
              <p className="truncate text-xs text-text-secondary">{deliverable.fileName}</p>
            ) : null}

            {canSubmitWork ? (
              <label className="inline-flex cursor-pointer">
                <span className="rounded-lg border border-border-default bg-white px-3 py-2 text-sm font-medium text-text-primary hover:bg-surface-muted/50">
                  {uploadMutation.isPending ? "Uploading…" : deliverable ? "Replace file" : "Upload file"}
                </span>
                <input
                  type="file"
                  accept="image/*,application/pdf,video/*,audio/*"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    e.target.value = "";
                    if (file) uploadMutation.mutate(file);
                  }}
                />
              </label>
            ) : null}

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-wide text-text-tertiary">
                Note
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                disabled={busy}
                placeholder={
                  canReview && status === "submitted"
                    ? "Optional review note / rejection reason"
                    : "Optional note for the reviewer"
                }
                className="w-full rounded-lg border border-border-default px-3 py-2 text-sm outline-none focus:border-primary-500"
              />
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {ghostQuery.isError ? (
              <p className="text-sm text-red-600">Could not load ghost node.</p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-border-default bg-surface-muted/20 px-5 py-3">
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClose}>
              Close
            </Button>
            {canReview && status === "submitted" ? (
              <>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  className="text-red-700"
                  onClick={() => {
                    if (!note.trim()) {
                      setError("Add a reason when rejecting.");
                      return;
                    }
                    reviewMutation.mutate("reject");
                  }}
                >
                  Reject
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={busy}
                  onClick={() => reviewMutation.mutate("approve")}
                >
                  Approve
                </Button>
              </>
            ) : null}
            {canSubmitWork ? (
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy || !deliverable?.mediaId || blocked}
                onClick={() => submitMutation.mutate()}
              >
                {submitMutation.isPending ? "Submitting…" : "Request approval"}
              </Button>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </>,
    document.body,
  );
}
