"use client";

import { Paperclip, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/theme";
import {
  uploadSchoolMediaFile,
  type GhostDto,
  type GhostImplementationType,
  type GhostRequirementAttachmentDto,
} from "@/modules/School/api";
import { GhostRequirementPreviewDialog } from "@/modules/School/ghost/GhostRequirementPreviewDialog";
import { ImplementationTypeSelect } from "@/modules/School/ghost/ImplementationTypeSelect";

export type GhostPropertyValues = Readonly<{
  description: string;
  implementationType: GhostImplementationType;
  dueAt: string | null;
  requirementAttachments: readonly GhostRequirementAttachmentDto[];
}>;

function formatDueInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const yyyy = String(d.getUTCFullYear());
  return `${yyyy}-${mm}-${dd}`;
}

function parseDueInput(value: string): string | null {
  const v = value.trim();
  if (!v) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** Property tab — create (draft) or edit an existing ghost. Description required to create. */
export function GhostPropertyTab({
  orgId,
  ghost,
  canMutate,
  busy,
  mode = "edit",
  onSave,
  onCreate,
}: Readonly<{
  orgId: string;
  ghost?: GhostDto | null;
  canMutate: boolean;
  busy?: boolean;
  mode?: "create" | "edit";
  onSave?: (patch: GhostPropertyValues) => void;
  onCreate?: (values: GhostPropertyValues) => void;
}>) {
  const isCreate = mode === "create" || !ghost;
  const fileRef = useRef<HTMLInputElement>(null);
  const [description, setDescription] = useState(ghost?.description ?? "");
  const [implementationType, setImplementationType] = useState<GhostImplementationType>(
    ghost?.implementationType ?? "same_base",
  );
  const [dueLocal, setDueLocal] = useState(formatDueInput(ghost?.dueAt ?? null));
  const [attachments, setAttachments] = useState<readonly GhostRequirementAttachmentDto[]>(
    ghost?.requirementAttachments ?? [],
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewAtt, setPreviewAtt] = useState<GhostRequirementAttachmentDto | null>(null);

  useEffect(() => {
    if (!ghost) return;
    setDescription(ghost.description);
    setImplementationType(ghost.implementationType);
    setDueLocal(formatDueInput(ghost.dueAt));
    setAttachments(ghost.requirementAttachments);
  }, [ghost]);

  useEffect(() => {
    if (!isCreate) return;
    setDescription("");
    setImplementationType("same_base");
    setDueLocal("");
    setAttachments([]);
    setLocalError(null);
    setUploadError(null);
  }, [isCreate]);

  const dirty =
    !isCreate &&
    ghost != null &&
    (description !== ghost.description ||
      implementationType !== ghost.implementationType ||
      parseDueInput(dueLocal) !== ghost.dueAt ||
      JSON.stringify(attachments) !== JSON.stringify(ghost.requirementAttachments));

  const values = (): GhostPropertyValues => ({
    description: description.trim(),
    implementationType,
    dueAt: parseDueInput(dueLocal),
    requirementAttachments: attachments,
  });

  const persistEdit = (nextAttachments?: readonly GhostRequirementAttachmentDto[]) => {
    onSave?.({
      description: description.trim(),
      implementationType,
      dueAt: parseDueInput(dueLocal),
      requirementAttachments: nextAttachments ?? attachments,
    });
  };

  const submitCreate = () => {
    const desc = description.trim();
    if (!desc) {
      setLocalError("Add a description before creating this ghost.");
      return;
    }
    setLocalError(null);
    onCreate?.(values());
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file || !canMutate) return;
    setUploadError(null);
    setUploading(true);
    try {
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: `Ghost requirement: ${file.name}`,
        visibility: "org",
        publishToFeed: false,
      });
      const next = [
        ...attachments,
        {
          mediaId: uploaded.mediaId,
          fileName: file.name,
        },
      ];
      setAttachments(next);
      if (!isCreate) persistEdit(next);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Could not upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 px-4 py-4">
      {isCreate ? (
        <p className="text-xs leading-relaxed text-[#5a6b7a]">
          Define Property first. A description is required — then create the ghost. Chain unlocks after
          create.
        </p>
      ) : null}

      <textarea
        value={description}
        disabled={!canMutate || busy || uploading}
        onChange={(e) => {
          setDescription(e.target.value);
          if (localError) setLocalError(null);
        }}
        placeholder="Describe this ghost resource…"
        rows={8}
        className="min-h-[11rem] w-full resize-none rounded-xl border border-[#c5d0da] bg-white px-3.5 py-3 text-sm leading-relaxed text-[#0f2a3d] outline-none focus:border-primary-500 disabled:opacity-60"
      />

      <div className="flex min-h-[2.75rem] items-center gap-2 rounded-xl border border-[#c5d0da] bg-[#eef3f6] px-3 py-2">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          {attachments.length === 0 ? (
            <span className="text-sm text-[#8a9aab]">Requirements</span>
          ) : (
            attachments.map((att) => (
              <span
                key={`${att.mediaId}-${att.fileName}`}
                className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-[#c5d0da] bg-white px-2.5 py-1 text-sm text-[#0f2a3d] shadow-sm"
              >
                <button
                  type="button"
                  className="truncate font-medium text-primary-800 underline-offset-2 hover:underline"
                  title={`Preview ${att.fileName}`}
                  onClick={() => setPreviewAtt(att)}
                >
                  {att.fileName}
                </button>
                {canMutate ? (
                  <button
                    type="button"
                    disabled={busy || uploading}
                    aria-label={`Remove ${att.fileName}`}
                    className="text-[#8a9aab] hover:text-[#0f2a3d]"
                    onClick={() => {
                      const next = attachments.filter((a) => a.mediaId !== att.mediaId);
                      setAttachments(next);
                      if (!isCreate) persistEdit(next);
                    }}
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                ) : null}
              </span>
            ))
          )}
        </div>
        <input
          ref={fileRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            void onPickFile(file);
          }}
        />
        <button
          type="button"
          disabled={!canMutate || busy || uploading}
          title="Attach requirement file"
          aria-label="Attach requirement file"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-primary-800 hover:bg-white/70 disabled:opacity-50"
          onClick={() => fileRef.current?.click()}
        >
          <Paperclip className="size-4" aria-hidden />
        </button>
      </div>
      {uploading ? <p className="text-xs text-[#5a6b7a]">Uploading file…</p> : null}
      {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
      {localError ? <p className="text-xs text-red-600">{localError}</p> : null}

      <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#0f2a3d]">Implementation Type</p>
          <ImplementationTypeSelect
            value={implementationType}
            disabled={!canMutate || busy || uploading}
            onChange={setImplementationType}
          />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-medium text-[#0f2a3d]">Due Date</p>
          <input
            type="date"
            value={dueLocal}
            disabled={!canMutate || busy || uploading}
            onChange={(e) => setDueLocal(e.target.value)}
            className="rounded-lg border border-[#c5d0da] bg-white px-3 py-2 text-sm text-[#0f2a3d] outline-none focus:border-primary-500 disabled:opacity-50"
          />
        </div>
      </div>

      {canMutate && isCreate ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          disabled={busy || uploading || !description.trim()}
          onClick={submitCreate}
        >
          {busy ? "Creating…" : "Create ghost"}
        </Button>
      ) : null}

      {canMutate && !isCreate && dirty ? (
        <Button
          type="button"
          variant="primary"
          size="md"
          className="w-full"
          disabled={busy || uploading || !description.trim()}
          onClick={() => persistEdit()}
        >
          {busy ? "Saving…" : "Save Property"}
        </Button>
      ) : null}

      {previewAtt ? (
        <GhostRequirementPreviewDialog
          open
          orgId={orgId}
          mediaId={previewAtt.mediaId}
          fileName={previewAtt.fileName}
          onClose={() => setPreviewAtt(null)}
        />
      ) : null}
    </div>
  );
}
