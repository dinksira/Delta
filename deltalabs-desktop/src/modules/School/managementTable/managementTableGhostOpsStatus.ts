import type { GhostNodeStatus } from "@/modules/School/api";
import {
  fetchSchoolGhost,
  reviewSchoolGhostVariant,
  submitSchoolGhostVariant,
  updateSchoolGhostVariant,
} from "@/modules/School/api";
import { parseGhostDeepLink } from "@/modules/School/managementTable/managementTableGhostCell";

/** Parse `ghost:{id}` or `ghost:{id}:variant:{vid}`. */
export function parseGhostOpsOpenKey(
  value: unknown,
): { ghostId: string; variantId: string | null } | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  const ghostId = parseGhostDeepLink(trimmed);
  if (!ghostId) return null;
  const m = trimmed.match(/^ghost:[A-Za-z0-9_-]+:variant:([A-Za-z0-9_-]+)$/);
  return { ghostId, variantId: m?.[1] ?? null };
}

export type GhostOpsStatusNoteKind =
  | "submitted"
  | "approved"
  | "rejected"
  | "changes_requested"
  | "stuck"
  | null;

export function ghostOpsStatusNeedsNote(nextStatus: string): GhostOpsStatusNoteKind {
  const s = nextStatus.trim();
  if (s === "submitted") return "submitted";
  if (s === "approved") return "approved";
  if (s === "rejected") return "rejected";
  if (s === "changes_requested") return "changes_requested";
  if (s === "stuck") return "stuck";
  return null;
}

export function ghostOpsStatusNoteCopy(kind: GhostOpsStatusNoteKind): {
  title: string;
  description: string;
  confirmLabel: string;
  required: boolean;
  confirmTone: "primary" | "danger";
} {
  switch (kind) {
    case "submitted":
      return {
        title: "Request approval",
        description:
          "For file/image variants, upload the real deliverable via Work first. This note is optional for the reviewer.",
        confirmLabel: "Request approval",
        required: false,
        confirmTone: "primary",
      };
    case "approved":
      return {
        title: "Approve work",
        description: "Optional note for the assignee.",
        confirmLabel: "Approve",
        required: false,
        confirmTone: "primary",
      };
    case "rejected":
      return {
        title: "Reject work",
        description: "Tell the assignee why this was rejected.",
        confirmLabel: "Reject",
        required: true,
        confirmTone: "danger",
      };
    case "changes_requested":
      return {
        title: "Request changes",
        description: "What should the assignee change?",
        confirmLabel: "Send back",
        required: true,
        confirmTone: "primary",
      };
    case "stuck":
      return {
        title: "Mark as stuck",
        description: "What is blocking this work?",
        confirmLabel: "Mark stuck",
        required: true,
        confirmTone: "primary",
      };
    default:
      return {
        title: "Note",
        description: "",
        confirmLabel: "Continue",
        required: false,
        confirmTone: "primary",
      };
  }
}

async function resolveVariantId(
  orgId: string,
  schoolId: string,
  ghostId: string,
  variantId: string | null,
): Promise<string> {
  if (variantId) return variantId;
  const ghost = await fetchSchoolGhost(orgId, schoolId, ghostId);
  const end =
    ghost.nodes.find((n) => n.role === "end") ??
    ghost.nodes.find((n) => n.isDefault) ??
    ghost.nodes[0];
  if (!end) throw new Error("Ghost has no end node.");
  return end.id;
}

/**
 * Apply a Ghost Ops Status change through ghost APIs (syncs MT mirror).
 * Pass `note` from GhostStatusNoteModal — never use window.prompt.
 */
export async function applyGhostOpsStatusChange(params: {
  orgId: string;
  schoolId: string;
  openKey: unknown;
  nextStatus: string;
  note?: string;
}): Promise<{ ok: boolean; openUploadWork?: { ghostId: string; variantId: string } }> {
  const parsed = parseGhostOpsOpenKey(params.openKey);
  if (!parsed) throw new Error("This row is not linked to a ghost node.");
  const variantId = await resolveVariantId(
    params.orgId,
    params.schoolId,
    parsed.ghostId,
    parsed.variantId,
  );
  const status = params.nextStatus.trim() as GhostNodeStatus | "";
  const note = (params.note ?? "").trim();

  if (!status || status === "open") {
    await updateSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      status: "open",
    });
    return { ok: true };
  }

  if (status === "submitted") {
    // Variant rows should upload a real file first — send caller to Work sheet.
    if (parsed.variantId) {
      const ghost = await fetchSchoolGhost(params.orgId, params.schoolId, parsed.ghostId);
      const node = ghost.nodes.find((n) => n.id === variantId);
      const head = node?.workingHead ?? {};
      const mediaId =
        typeof head.mediaId === "string"
          ? head.mediaId.trim()
          : typeof head.media_id === "string"
            ? head.media_id.trim()
            : "";
      if (!mediaId) {
        return { ok: false, openUploadWork: { ghostId: parsed.ghostId, variantId } };
      }
      await submitSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
        note,
        outputRefs: [
          {
            contentType: "media_asset",
            mediaId,
            fileName: String(head.fileName || head.file_name || "Deliverable"),
            previewUrl: String(head.previewUrl || head.preview_url || ""),
          },
        ],
      });
      return { ok: true };
    }
    await submitSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      note,
    });
    return { ok: true };
  }

  if (status === "approved") {
    await reviewSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      decision: "approve",
      note,
    });
    return { ok: true };
  }

  if (status === "rejected") {
    await reviewSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      decision: "reject",
      note,
    });
    return { ok: true };
  }

  if (status === "changes_requested") {
    await reviewSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      decision: "changes_requested",
      note,
    });
    return { ok: true };
  }

  if (status === "stuck") {
    await updateSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      status: "stuck",
      statusNote: note,
    });
    return { ok: true };
  }

  if (status === "in_progress" || status === "abandoned" || status === "merged") {
    await updateSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
      status,
    });
    return { ok: true };
  }

  if (status === "fulfilled" || status === "cancelled") {
    throw new Error(
      status === "fulfilled"
        ? "Use Fulfill on the Ghost drawer when the end node is approved."
        : "Cancel ghosts from the Ghost Ops row actions.",
    );
  }

  await updateSchoolGhostVariant(params.orgId, params.schoolId, parsed.ghostId, variantId, {
    status: status as GhostNodeStatus,
  });
  return { ok: true };
}
