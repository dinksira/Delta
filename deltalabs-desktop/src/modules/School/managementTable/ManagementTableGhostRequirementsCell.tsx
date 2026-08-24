"use client";

import { useState } from "react";

import { GhostRequirementPreviewDialog } from "@/modules/School/ghost/GhostRequirementPreviewDialog";
import {
  parseGhostRequirementCell,
  type GhostRequirementRef,
} from "@/modules/School/managementTable/managementTableGhostRequirements";

export function ManagementTableGhostRequirementsCell({
  orgId,
  value,
}: Readonly<{
  orgId: string;
  value: unknown;
}>) {
  const refs = parseGhostRequirementCell(value);
  const [preview, setPreview] = useState<GhostRequirementRef | null>(null);

  if (refs.length === 0) {
    return <span className="px-1 text-sm text-text-tertiary">—</span>;
  }

  return (
    <>
      <div className="flex min-w-0 flex-wrap gap-1 px-0.5 py-0.5">
        {refs.map((ref) => {
          const key = `${ref.mediaId ?? "x"}-${ref.fileName}`;
          const canOpen = Boolean(ref.mediaId);
          return (
            <button
              key={key}
              type="button"
              disabled={!canOpen}
              title={canOpen ? `Preview ${ref.fileName}` : ref.fileName}
              className={[
                "inline-flex max-w-full items-center truncate rounded-md border px-1.5 py-0.5 text-left text-xs font-medium transition-colors",
                canOpen
                  ? "border-[#9ec4c0] bg-white text-[#0f2a3d] hover:border-primary-500 hover:bg-primary-50"
                  : "border-transparent bg-transparent text-text-primary",
              ].join(" ")}
              onClick={() => {
                if (!canOpen) return;
                setPreview(ref);
              }}
            >
              <span className="truncate">{ref.fileName}</span>
            </button>
          );
        })}
      </div>
      {preview?.mediaId ? (
        <GhostRequirementPreviewDialog
          open
          orgId={orgId}
          mediaId={preview.mediaId}
          fileName={preview.fileName}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </>
  );
}
