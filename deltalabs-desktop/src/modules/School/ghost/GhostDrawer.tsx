"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ghost, History, Table2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { ApiError } from "@/lib/apiClient";
import { Button } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  bootstrapGhostOpsTable,
  createSchoolGhost,
  createSchoolGhostEdge,
  createSchoolGhostVariant,
  deleteSchoolGhostEdge,
  ensureSchoolGhostExerciseDraft,
  ensureSchoolGhostSummaryDraft,
  fetchSchoolGhost,
  fulfillSchoolGhost,
  reviewSchoolGhostVariant,
  submitSchoolGhostVariant,
  updateSchoolGhost,
  type GhostDto,
  type GhostImplementationType,
  type GhostNodeDto,
} from "@/modules/School/api";
import { GhostChainTab } from "@/modules/School/ghost/GhostChainTab";
import { GhostHistoryTab } from "@/modules/School/ghost/GhostHistoryTab";
import {
  GhostPropertyTab,
  type GhostPropertyValues,
} from "@/modules/School/ghost/GhostPropertyTab";
import { GhostVariantModal } from "@/modules/School/ghost/GhostVariantModal";
import type { GhostDrawerProps, GhostDrawerTab } from "@/modules/School/ghost/types";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function ghostChromeTitle(kind: string | undefined): string {
  if (kind === "exercise") return "Exercise ghost";
  if (kind === "test") return "Test ghost";
  if (kind === "fast_summary") return "Fast Summary ghost";
  return "Ghost";
}

function exerciseDraftIdFromNode(node: GhostNodeDto): string | null {
  const head = node.workingHead ?? {};
  const raw = head.exerciseDraftId ?? head.exercise_draft_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

function summaryDraftIdFromNode(node: GhostNodeDto): string | null {
  const head = node.workingHead ?? {};
  const raw = head.summaryDraftId ?? head.summary_draft_id;
  return typeof raw === "string" && raw.trim() ? raw.trim() : null;
}

/**
 * Host-agnostic Ghost definition drawer (Figma: Property | Chain | History).
 * Open from course exercise, class roadmap, intro slots, etc. — pass host context only.
 */
export function GhostDrawer({
  open,
  host,
  ghostId,
  canMutate,
  onClose,
  onGhostCreated,
  onOpenOpsTable,
}: GhostDrawerProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const currentUserId = session?.user?.id ?? null;
  const [tab, setTab] = useState<GhostDrawerTab>("property");
  const [activeGhostId, setActiveGhostId] = useState<string | null>(ghostId);
  const [variantOpen, setVariantOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectFromId, setConnectFromId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setActiveGhostId(ghostId);
    setTab("property");
    setError(null);
    setVariantOpen(false);
  }, [open, ghostId]);

  const ghostQuery = useQuery({
    queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId ?? "none"),
    queryFn: () => fetchSchoolGhost(host.orgId, host.schoolId, activeGhostId!),
    enabled: open && Boolean(activeGhostId),
  });

  const createMutation = useMutation({
    mutationFn: async (values: GhostPropertyValues) => {
      const created = await createSchoolGhost(host.orgId, host.schoolId, {
        hostType: host.hostType,
        hostWorkspaceItemId: host.hostWorkspaceItemId,
        slotKey: host.slotKey ?? "",
        resourceKind: host.resourceKind ?? "document",
        defaultNodeName: host.defaultNodeName ?? "Default",
        description: values.description,
        implementationType: values.implementationType,
        dueAt: values.dueAt,
      });
      if (values.requirementAttachments.length > 0) {
        return updateSchoolGhost(host.orgId, host.schoolId, created.id, {
          requirementAttachments: values.requirementAttachments,
        });
      }
      return created;
    },
    onSuccess: async (ghost) => {
      setActiveGhostId(ghost.id);
      setTab("property");
      setError(null);
      onGhostCreated?.(ghost);
      await queryClient.invalidateQueries({
        queryKey: ["school", "ghosts", host.orgId, host.schoolId],
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, ghost.id),
      });
      if (ghost.resourceKind === "exercise" || ghost.resourceKind === "test") {
        await queryClient.invalidateQueries({
          queryKey: schoolQueryKeys.courseExercises(
            host.orgId,
            host.schoolId,
            ghost.hostWorkspaceItemId,
            ghost.resourceKind,
          ),
        });
      }
      if (ghost.resourceKind === "fast_summary") {
        await queryClient.invalidateQueries({
          queryKey: schoolQueryKeys.courseSummaries(
            host.orgId,
            host.schoolId,
            ghost.hostWorkspaceItemId,
          ),
        });
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not create ghost.");
    },
  });

  const updateMutation = useMutation({
    mutationFn: (patch: GhostPropertyValues) =>
      updateSchoolGhost(host.orgId, host.schoolId, activeGhostId!, patch),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not save property.");
    },
  });

  const variantMutation = useMutation({
    mutationFn: (payload: { name: string; implementationType: GhostImplementationType }) => {
      // Only auto-link when user picked a source node (+ on a card). Bottom "Add Variant" stays free.
      return createSchoolGhostVariant(host.orgId, host.schoolId, activeGhostId!, {
        name: payload.name,
        role: "variant",
        implementationType: payload.implementationType,
        connectFromVariantId: connectFromId,
      });
    },
    onSuccess: async () => {
      setVariantOpen(false);
      setConnectFromId(null);
      setError(null);
      setTab("chain");
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not add variant.");
    },
  });

  const edgeMutation = useMutation({
    mutationFn: (payload: { fromVariantId: string; toVariantId: string }) =>
      createSchoolGhostEdge(host.orgId, host.schoolId, activeGhostId!, payload),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not connect nodes.");
    },
  });

  const edgeDeleteMutation = useMutation({
    mutationFn: (edgeId: string) =>
      deleteSchoolGhostEdge(host.orgId, host.schoolId, activeGhostId!, edgeId),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not remove link.");
    },
  });

  const edgeReverseMutation = useMutation({
    mutationFn: async (payload: { edgeId: string; fromVariantId: string; toVariantId: string }) => {
      await deleteSchoolGhostEdge(host.orgId, host.schoolId, activeGhostId!, payload.edgeId);
      return createSchoolGhostEdge(host.orgId, host.schoolId, activeGhostId!, {
        fromVariantId: payload.toVariantId,
        toVariantId: payload.fromVariantId,
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not reverse link.");
    },
  });

  const flowMutation = useMutation({
    mutationFn: (args: { kind: "submit" | "approve"; variantId: string }) => {
      if (args.kind === "submit") {
        return submitSchoolGhostVariant(host.orgId, host.schoolId, activeGhostId!, args.variantId);
      }
      return reviewSchoolGhostVariant(host.orgId, host.schoolId, activeGhostId!, args.variantId, {
        decision: "approve",
      });
    },
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not update chain node.");
    },
  });

  const fulfillMutation = useMutation({
    mutationFn: () => fulfillSchoolGhost(host.orgId, host.schoolId, activeGhostId!),
    onSuccess: async () => {
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghost(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.ghostEvents(host.orgId, host.schoolId, activeGhostId!),
      });
      await queryClient.invalidateQueries({
        queryKey: ["school", "ghosts", host.orgId, host.schoolId],
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(host.orgId, host.schoolId, host.hostWorkspaceItemId),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not fulfill ghost.");
    },
  });

  const openWorkMutation = useMutation({
    mutationFn: async (variantId: string) => {
      const current = ghostQuery.data;
      if (!current) throw new Error("Ghost not loaded.");
      const node = current.nodes.find((n) => n.id === variantId);
      if (!node) throw new Error("Chain node not found.");
      const kind = current.resourceKind;

      if (kind === "fast_summary") {
        let draftId = summaryDraftIdFromNode(node);
        let nextGhost: GhostDto = current;
        if (!draftId) {
          nextGhost = await ensureSchoolGhostSummaryDraft(
            host.orgId,
            host.schoolId,
            current.id,
            variantId,
          );
          const refreshed = nextGhost.nodes.find((n) => n.id === variantId);
          draftId = refreshed ? summaryDraftIdFromNode(refreshed) : null;
        }
        if (!draftId) {
          throw new Error("Could not link a summary draft to this node.");
        }
        return {
          kind: "summary" as const,
          courseItemId: nextGhost.hostWorkspaceItemId || host.hostWorkspaceItemId,
          draftId,
        };
      }

      if (kind !== "exercise" && kind !== "test") {
        throw new Error("Open work is only available for Exercise, Test, or Fast Summary ghosts.");
      }

      let draftId = exerciseDraftIdFromNode(node);
      let nextGhost: GhostDto = current;
      if (!draftId) {
        nextGhost = await ensureSchoolGhostExerciseDraft(
          host.orgId,
          host.schoolId,
          current.id,
          variantId,
        );
        const refreshed = nextGhost.nodes.find((n) => n.id === variantId);
        draftId = refreshed ? exerciseDraftIdFromNode(refreshed) : null;
      }
      if (!draftId) {
        throw new Error("Could not link an exercise draft to this node.");
      }
      return {
        kind: "exercise" as const,
        courseItemId: nextGhost.hostWorkspaceItemId || host.hostWorkspaceItemId,
        draftId,
      };
    },
    onSuccess: ({ kind, courseItemId, draftId }) => {
      setError(null);
      onClose();
      if (kind === "summary") {
        router.push(
          `/features/school/${encodeURIComponent(host.schoolId)}/course/${encodeURIComponent(courseItemId)}/summaries/${encodeURIComponent(draftId)}/edit`,
        );
        return;
      }
      router.push(
        `/features/school/${encodeURIComponent(host.schoolId)}/course/${encodeURIComponent(courseItemId)}/exercises/${encodeURIComponent(draftId)}/edit`,
      );
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not open work.");
    },
  });

  const opsTableMutation = useMutation({
    mutationFn: () =>
      bootstrapGhostOpsTable(host.orgId, host.schoolId, host.hostWorkspaceItemId),
    onSuccess: (boot) => {
      setError(null);
      if (onOpenOpsTable) {
        onOpenOpsTable(boot);
        onClose();
        return;
      }
      router.push(
        `/features/school/${encodeURIComponent(host.schoolId)}/management-tables/${encodeURIComponent(boot.instanceId)}`,
      );
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not open ghost ops table.");
    },
  });

  if (!open) return null;

  const ghost = ghostQuery.data;
  const creating = createMutation.isPending;
  const needsCreate = !activeGhostId && !creating;
  const chromeKind = ghost?.resourceKind ?? host.resourceKind;
  const chromeTitle = ghostChromeTitle(chromeKind);

  return createPortal(
    <>
      <div
        role="presentation"
        className="fixed bottom-[4.75rem] left-0 right-0 top-16 z-[1490] bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside
        className="fixed bottom-[4.75rem] right-0 top-16 z-[1500] flex w-full max-w-[520px] flex-col border-l border-[#c5d0da] bg-[#e8eef2] shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ghost-drawer-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#d5dee6] bg-[#eef3f6] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <Ghost className="size-5 shrink-0 text-primary-800" strokeWidth={1.6} aria-hidden />
            <h2 id="ghost-drawer-title" className="truncate text-base font-bold text-[#0f2a3d]">
              {chromeTitle}
            </h2>
            {canMutate && !needsCreate ? (
              <button
                type="button"
                disabled={opsTableMutation.isPending}
                onClick={() => opsTableMutation.mutate()}
                className="ml-1 inline-flex items-center gap-1 rounded-md border border-[#c5d0da] bg-white px-2 py-1 text-[11px] font-semibold text-primary-800 hover:bg-white/80 disabled:opacity-50"
                title="Open ghost ops management table"
              >
                <Table2 className="size-3" aria-hidden />
                {opsTableMutation.isPending ? "Opening…" : "Table"}
              </button>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-[#5a6b7a] hover:bg-white/70"
            aria-label="Close ghost"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex items-end gap-5 bg-[#eef3f6] px-4">
          {(
            [
              ["property", "Property"],
              ["chain", "Chain"],
            ] as const
          ).map(([id, label]) => {
            const active = tab === id;
            const locked = needsCreate && id !== "property";
            return (
              <button
                key={id}
                type="button"
                disabled={locked}
                onClick={() => setTab(id)}
                className={[
                  "relative pb-2.5 pt-2 text-sm transition-colors",
                  locked ? "cursor-not-allowed font-medium text-[#b7c2cc]" : "",
                  !locked && active
                    ? "font-bold text-[#0f2a3d]"
                    : !locked
                      ? "font-medium text-[#8a9aab] hover:text-[#0f2a3d]"
                      : "",
                ].join(" ")}
                title={locked ? "Create the ghost from Property first" : undefined}
              >
                {label}
                {active && !locked ? (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#0f2a3d]" />
                ) : null}
              </button>
            );
          })}
          <button
            type="button"
            disabled={needsCreate}
            onClick={() => setTab("history")}
            className={[
              "relative ml-auto inline-flex items-center gap-1.5 pb-2.5 pt-2 text-sm transition-colors",
              needsCreate
                ? "cursor-not-allowed font-medium text-[#b7c2cc]"
                : tab === "history"
                  ? "font-bold text-[#0f2a3d]"
                  : "font-medium text-[#8a9aab] hover:text-[#0f2a3d]",
            ].join(" ")}
            title={needsCreate ? "Create the ghost from Property first" : undefined}
          >
            <History className="size-3.5" aria-hidden />
            History
            {tab === "history" && !needsCreate ? (
              <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#0f2a3d]" />
            ) : null}
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          {error ? (
            <p className="border-b border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {creating ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-sm text-[#5a6b7a]">Creating ghost…</p>
            </div>
          ) : needsCreate ? (
            <GhostPropertyTab
              orgId={host.orgId}
              mode="create"
              canMutate={canMutate}
              busy={createMutation.isPending}
              onCreate={(values) => createMutation.mutate(values)}
            />
          ) : ghostQuery.isPending ? (
            <div className="flex h-full items-center justify-center px-6">
              <p className="text-sm text-[#5a6b7a]">Loading…</p>
            </div>
          ) : ghostQuery.isError ? (
            <p className="px-4 py-8 text-sm text-red-600">
              {ghostQuery.error instanceof ApiError
                ? ghostQuery.error.message
                : "Could not load ghost."}
            </p>
          ) : ghost ? (
            tab === "property" ? (
              <GhostPropertyTab
                orgId={host.orgId}
                mode="edit"
                ghost={ghost}
                canMutate={canMutate}
                busy={updateMutation.isPending}
                onSave={(patch) => updateMutation.mutate(patch)}
              />
            ) : tab === "chain" ? (
              <GhostChainTab
                ghost={ghost}
                canMutate={canMutate}
                currentUserId={currentUserId}
                busy={
                  variantMutation.isPending ||
                  flowMutation.isPending ||
                  edgeMutation.isPending ||
                  edgeDeleteMutation.isPending ||
                  edgeReverseMutation.isPending ||
                  openWorkMutation.isPending
                }
                onAddVariant={(fromId) => {
                  setConnectFromId(fromId ?? null);
                  setVariantOpen(true);
                }}
                onConnectEdge={(fromVariantId, toVariantId) =>
                  edgeMutation.mutate({ fromVariantId, toVariantId })
                }
                onDisconnectEdge={(edgeId) => edgeDeleteMutation.mutate(edgeId)}
                onReverseEdge={(edge) => edgeReverseMutation.mutate(edge)}
                onSubmit={(variantId) => flowMutation.mutate({ kind: "submit", variantId })}
                onApprove={(variantId) => flowMutation.mutate({ kind: "approve", variantId })}
                onOpenWork={
                  ghost.resourceKind === "exercise" ||
                  ghost.resourceKind === "test" ||
                  ghost.resourceKind === "fast_summary"
                    ? (variantId) => openWorkMutation.mutate(variantId)
                    : undefined
                }
              />
            ) : (
              <GhostHistoryTab
                orgId={host.orgId}
                schoolId={host.schoolId}
                ghostId={ghost.id}
              />
            )
          ) : null}
        </div>

        {ghost &&
        (ghost.resourceKind === "exercise" ||
          ghost.resourceKind === "test" ||
          ghost.resourceKind === "fast_summary") &&
        ghost.status !== "fulfilled" ? (
          <div className="border-t border-[#d5dee6] bg-[#eef3f6] px-4 py-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full"
              disabled={openWorkMutation.isPending}
              onClick={() => {
                const end =
                  ghost.nodes.find((n) => n.role === "end") ??
                  ghost.nodes.find((n) => n.isDefault) ??
                  ghost.nodes[0];
                if (end) openWorkMutation.mutate(end.id);
              }}
            >
              {openWorkMutation.isPending ? "Opening…" : "Open work"}
            </Button>
          </div>
        ) : null}

        {ghost && canMutate && ghost.status !== "fulfilled" ? (
          <div className="space-y-1.5 border-t border-[#d5dee6] bg-[#eef3f6] px-4 py-3">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="w-full"
              disabled={!ghost.canFulfill || fulfillMutation.isPending}
              title={
                ghost.canFulfill
                  ? "Publish the finished end resource onto this course/class"
                  : "Approve the end node and required chain links first"
              }
              onClick={() => fulfillMutation.mutate()}
            >
              {fulfillMutation.isPending ? "Fulfilling…" : "Fulfill resource"}
            </Button>
            <p className="text-center text-[11px] leading-snug text-[#8a9aab]">
              {ghost.canFulfill
                ? "Turns this ghost into the real student-facing resource on this host."
                : "Approve the end node (and required upstream links) to unlock fulfill."}
            </p>
          </div>
        ) : null}

        {ghost?.status === "fulfilled" ? (
          <div className="border-t border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-center text-sm font-medium text-emerald-800">
              Fulfilled — real resource published on this host.
            </p>
          </div>
        ) : null}
      </aside>

      {variantOpen ? (
        <GhostVariantModal
          busy={variantMutation.isPending}
          error={error}
          onClose={() => !variantMutation.isPending && setVariantOpen(false)}
          onSave={(payload) => variantMutation.mutate(payload)}
        />
      ) : null}
    </>,
    document.body,
  );
}
