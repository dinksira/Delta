"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  bootstrapGhostOpsTable,
  ensureSchoolGhostExerciseDraft,
  fetchManagementTableInstanceBundle,
  fetchSchoolGhost,
} from "@/modules/School/api";
import { GhostDrawer } from "@/modules/School/ghost";
import { GhostUploadWorkSheet } from "@/modules/School/ghost/GhostUploadWorkSheet";
import { parseGhostOpsOpenKey } from "@/modules/School/managementTable/managementTableGhostOpsStatus";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { MANAGEMENT_TABLE_WORKSPACE_KIND } from "@/modules/School/managementTable/managementTableWorkspaceKind";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";
import { useManagementTableKindGuard } from "@/modules/School/managementTable/useManagementTableKindGuard";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export function readGhostOpsTableInstanceId(
  metadata: Record<string, unknown> | null | undefined,
): string | null {
  const raw = metadata?.ghostOpsTableInstanceId;
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  return id || null;
}

/** Ghost ops board embedded in Course → Exercise & Test → Management Table. */
export function CourseExerciseGhostOpsTable({
  orgId,
  schoolId,
  workspaceItemId,
  itemMetadata,
  canMutate,
  preferredInstanceId,
  onBootstrapped,
  showPageHeader = true,
}: Readonly<{
  orgId: string;
  schoolId: string;
  workspaceItemId: string;
  itemMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
  /** From a just-completed bootstrap (Open Management Table). */
  preferredInstanceId?: string | null;
  onBootstrapped?: (instanceId: string) => void;
  /** When false, hide the page-level title (parent already provides back + context). */
  showPageHeader?: boolean;
}>) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [instanceId, setInstanceId] = useState<string | null>(
    () => preferredInstanceId?.trim() || readGhostOpsTableInstanceId(itemMetadata),
  );
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);
  const [uploadWork, setUploadWork] = useState<{ ghostId: string; variantId: string } | null>(null);
  const [workError, setWorkError] = useState<string | null>(null);
  const addColumn = useManagementTableAddColumnPopover();

  useEffect(() => {
    const fromMeta = readGhostOpsTableInstanceId(itemMetadata);
    const fromPreferred = preferredInstanceId?.trim() || null;
    setInstanceId(fromPreferred || fromMeta);
  }, [itemMetadata, preferredInstanceId]);

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapGhostOpsTable(orgId, schoolId, workspaceItemId),
    onSuccess: (data) => {
      setInstanceId(data.instanceId);
      onBootstrapped?.(data.instanceId);
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, workspaceItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, data.instanceId),
      });
      void queryClient.invalidateQueries({
        queryKey: ["school", "management-tables", "rows", orgId, schoolId, data.instanceId],
      });
    },
  });

  // Always re-run bootstrap: ensures Property columns + parent/variant hierarchy sync.
  useEffect(() => {
    if (!canMutate || bootstrapMutation.isPending) return;
    bootstrapMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMutate, workspaceItemId]);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId ?? "none"),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId!),
    enabled: Boolean(orgId && schoolId && instanceId),
    staleTime: 15_000,
  });

  const repairTableBootstrap = useCallback(() => {
    setInstanceId(null);
    bootstrapMutation.mutate();
  }, [bootstrapMutation]);

  useManagementTableKindGuard({
    tableKind: MANAGEMENT_TABLE_WORKSPACE_KIND.ghosts,
    instanceId,
    bundle: bundleQuery.data,
    canMutate,
    bootstrapPending: bootstrapMutation.isPending,
    onRepair: repairTableBootstrap,
    isBundleValid: (bundle) => {
      const titles = new Set(
        bundle.definition.columns.map((col) => col.title.trim().toLowerCase()),
      );
      return (
        titles.has("open ghost") ||
        titles.has("ghost title") ||
        titles.has("item") ||
        titles.has("description")
      );
    },
  });

  const invalidateBundleAndRows = async () => {
    if (!instanceId) return;
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  };

  const appendColumnMutation = useMutation({
    mutationFn: (type: ManagementTableColumnTypeDto) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: defaultTitleForColumnType(type),
        type,
        settings: defaultSettingsForColumnType(type),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(MANAGEMENT_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) return;
    appendColumnMutation.mutate(opt.supportedType, {
      onSettled: () => addColumn.close(),
    });
  };

  const openGhost = (id: string) => {
    setGhostId(id);
    setGhostOpen(true);
  };

  const openWorkMutation = useMutation({
    mutationFn: async (id: string) => {
      let ghost = await fetchSchoolGhost(orgId, schoolId, id);
      if (ghost.resourceKind !== "exercise" && ghost.resourceKind !== "test") {
        throw new Error("Open work is only available for Exercise or Test ghosts.");
      }
      const end =
        ghost.nodes.find((n) => n.role === "end") ??
        ghost.nodes.find((n) => n.isDefault) ??
        ghost.nodes[0];
      if (!end) throw new Error("Ghost has no end node.");
      const head = end.workingHead ?? {};
      let draftId =
        typeof head.exerciseDraftId === "string"
          ? head.exerciseDraftId.trim()
          : typeof head.exercise_draft_id === "string"
            ? head.exercise_draft_id.trim()
            : "";
      if (!draftId) {
        ghost = await ensureSchoolGhostExerciseDraft(orgId, schoolId, id, end.id);
        const refreshed =
          ghost.nodes.find((n) => n.id === end.id) ??
          ghost.nodes.find((n) => n.role === "end") ??
          ghost.nodes[0];
        const rh = refreshed?.workingHead ?? {};
        draftId =
          typeof rh.exerciseDraftId === "string"
            ? rh.exerciseDraftId.trim()
            : typeof rh.exercise_draft_id === "string"
              ? rh.exercise_draft_id.trim()
              : "";
      }
      if (!draftId) throw new Error("Could not link an exercise draft.");
      return {
        courseItemId: ghost.hostWorkspaceItemId || workspaceItemId,
        exerciseId: draftId,
      };
    },
    onSuccess: ({ courseItemId, exerciseId }) => {
      setWorkError(null);
      router.push(
        `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}/exercises/${encodeURIComponent(exerciseId)}/edit`,
      );
    },
    onError: (err) => {
      setWorkError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Could not open work.");
    },
  });

  if (!instanceId) {
    if (bootstrapMutation.isPending) {
      return <div className="h-40 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />;
    }
    if (!canMutate) {
      return (
        <div
          className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center"
          role="status"
        >
          <Table2 className="mb-3 size-8 text-text-tertiary" aria-hidden />
          <p className="text-sm font-semibold text-text-primary">Ghost ops table not set up</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            A school manager needs to open Management Table once to create the ghost ops board for this
            course.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {bootstrapMutation.isError ? (
          <p className="text-sm text-red-600">
            {bootstrapMutation.error instanceof ApiError
              ? bootstrapMutation.error.message
              : "Could not create ghost ops table."}
          </p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
        >
          Create ghost ops table
        </Button>
      </div>
    );
  }

  if (bundleQuery.isPending) {
    return <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />;
  }

  if (bundleQuery.isError || !bundleQuery.data) {
    return (
      <p className="text-sm text-red-600">
        {bundleQuery.error instanceof ApiError
          ? bundleQuery.error.message
          : "Could not load ghost ops table."}
      </p>
    );
  }

  const definitionId = bundleQuery.data.definition.id;
  const columns = bundleQuery.data.definition.columns;
  const mainGroup = bundleQuery.data.instance.tableGroups[0] ?? {
    id: "mtg_main",
    title: "Ghost Ops",
    order: 0,
  };

  return (
    <section className="space-y-3" aria-label="Ghost ops management table">
      {showPageHeader ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1f3f4f]">Ghost Ops</h2>
              <span className="rounded-md bg-[#2f5d73]/10 px-2 py-0.5 text-[11px] font-semibold text-[#2f5d73]">
                Ghost
              </span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
              <span className="font-medium text-text-secondary">Work</span> opens the right surface:
              exercise builder on the parent, or upload/preview for image (and other file) variants.
              Then request approval. Creators/managers approve or reject after reviewing the file.
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-text-tertiary">
          Nested subitems appear only when a ghost has more than the default variant.
        </p>
      )}
      {bootstrapMutation.isPending ? (
        <p className="text-xs font-medium text-[#2f5d73]">Syncing ghost ↔ variant hierarchy…</p>
      ) : null}
      {workError ? <p className="text-sm text-red-600">{workError}</p> : null}
      <ManagementTableGroupSection
        orgId={orgId}
        schoolId={schoolId}
        definitionId={definitionId}
        instanceId={instanceId}
        groupId={mainGroup.id}
        groupTitle="Ghost Ops"
        columns={columns}
        parentEnabled
        personPicker="platform"
        appearance="ghostOps"
        boardTabLabel="Ghost Ops"
        allowAddRow={false}
        onlyEditableColumnTitles={canMutate ? ["Assignee", "Status"] : ["Status"]}
        emptyRowsMessage="No ghosts yet. Create one from Direct View."
        onOpenAddColumn={addColumn.openFromButton}
        onOpenGhost={openGhost}
        onOpenWork={(openKey) => {
          const parsed = parseGhostOpsOpenKey(openKey);
          if (!parsed) return;
          if (parsed.variantId) {
            setUploadWork({ ghostId: parsed.ghostId, variantId: parsed.variantId });
            return;
          }
          openWorkMutation.mutate(parsed.ghostId);
        }}
        onOpenUploadWork={(args) => setUploadWork(args)}
      />
      <ManagementTableAddColumnPopover
        open={addColumn.open}
        anchor={addColumn.anchor}
        popoverRef={addColumn.popoverRef}
        search={addColumn.search}
        onSearchChange={addColumn.setSearch}
        groups={addColumnOptions}
        onPick={onPickAddColumnOption}
        pending={appendColumnMutation.isPending}
        zIndex={4000}
      />
      <GhostDrawer
        open={ghostOpen}
        canMutate={canMutate}
        ghostId={ghostId}
        host={{
          orgId,
          schoolId,
          hostType: "course",
          hostWorkspaceItemId: workspaceItemId,
        }}
        onClose={() => setGhostOpen(false)}
      />
      {uploadWork ? (
        <GhostUploadWorkSheet
          open
          orgId={orgId}
          schoolId={schoolId}
          ghostId={uploadWork.ghostId}
          variantId={uploadWork.variantId}
          canReview={canMutate}
          onClose={() => setUploadWork(null)}
        />
      ) : null}
    </section>
  );
}
