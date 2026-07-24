"use client";

/** Board editor: shared column schema; one or more table groups (row sets) per instance. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Table2 } from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";

import { SchoolDetailUtilityActions } from "@/components/features/school/SchoolDetailUtilityActions";
import { Button, DialogOverlay, DialogPanel } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto, ManagementTableGroupDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  createManagementTableTableGroup,
  fetchManagementTableInstanceBundle,
} from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { GhostDrawer } from "@/modules/School/ghost";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import {
  MANAGEMENT_TABLE_WORKSPACE_KIND,
  instanceMatchesTableKind,
} from "@/modules/School/managementTable/managementTableWorkspaceKind";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

type ManagementTableEditorViewProps = Readonly<{
  schoolId: string;
  instanceId: string;
}>;

export function ManagementTableEditorView({ schoolId, instanceId }: ManagementTableEditorViewProps) {
  const queryClient = useQueryClient();
  const { activeOrgId, mySchoolsPending } = useSchoolActiveOrgId();
  const orgId = activeOrgId ?? "";
  const enabled = Boolean(orgId && schoolId && instanceId) && !mySchoolsPending;

  const addColumn = useManagementTableAddColumnPopover();

  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);

  const bundleQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    queryFn: () => fetchManagementTableInstanceBundle(orgId, schoolId, instanceId),
    enabled,
  });

  const tableGroups: readonly ManagementTableGroupDto[] = useMemo(() => {
    const raw = bundleQuery.data?.instance.tableGroups;
    if (raw && raw.length > 0) return [...raw].sort((a, b) => a.order - b.order);
    return [{ id: "mtg_main", title: "Main Table", order: 0 }];
  }, [bundleQuery.data?.instance.tableGroups]);

  const invalidateBundleAndRows = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  }, [queryClient, orgId, schoolId, instanceId]);

  const appendColumnMutation = useMutation({
    mutationFn: (type: ManagementTableColumnTypeDto) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, {
        title: defaultTitleForColumnType(type),
        type,
        settings: defaultSettingsForColumnType(type),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const createTableGroupMutation = useMutation({
    mutationFn: (title: string) => createManagementTableTableGroup(orgId, schoolId, instanceId, { title }),
    onSuccess: async () => {
      setNewGroupDialogOpen(false);
      setNewGroupTitle("");
      await invalidateBundleAndRows();
    },
  });

  const openNewTableGroupDialog = useCallback(() => {
    createTableGroupMutation.reset();
    setNewGroupTitle("");
    setNewGroupDialogOpen(true);
  }, [createTableGroupMutation]);

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(MANAGEMENT_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) {
      window.alert("This column type is coming soon.");
      return;
    }
    appendColumnMutation.mutate(opt.supportedType, {
      onSettled: () => addColumn.close(),
    });
  };

  if (!enabled && !mySchoolsPending) {
    return <p className="text-sm text-text-secondary">Select an organization to load this table.</p>;
  }

  if (bundleQuery.isError) {
    const msg = bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load table.";
    return <p className="text-sm text-red-600">{msg}</p>;
  }

  const instanceTitle = bundleQuery.data?.instance.title ?? "Loading…";
  const templateTitle = bundleQuery.data?.definition.title ?? "—";
  const columns = bundleQuery.data?.definition.columns ?? [];
  const isGhostOpsTable = Boolean(
    bundleQuery.data &&
      instanceMatchesTableKind(bundleQuery.data.instance, MANAGEMENT_TABLE_WORKSPACE_KIND.ghosts),
  );
  const ghostHostWorkspaceItemId =
    bundleQuery.data?.instance.workspaceItemId?.trim() || "";

  return (
    <div className={["mx-auto max-w-[100rem] pb-24", CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding].join(" ")}>
      <header className="mb-7 sm:mb-9">
        <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
            <Link
              href={`/features/school/${encodeURIComponent(schoolId)}`}
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted sm:h-9 sm:w-9"
              aria-label="Back to school workspace"
            >
              <ArrowLeft className="size-4 sm:size-[1.05rem]" aria-hidden />
            </Link>
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
              aria-hidden
              title="Management table"
            >
              <Table2 className="size-3.5 sm:size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pr-1">
              <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 sm:gap-x-3">
                <h1 className={[CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass, "shrink-0"].join(" ")}>
                  {isGhostOpsTable ? "Ghost Management Table" : "Management Table"}
                </h1>
                <p className="min-w-0 truncate text-xs text-text-tertiary sm:text-sm">
                  <span className="font-medium text-text-secondary">{instanceTitle}</span>
                  <span aria-hidden className="px-1.5 text-text-tertiary sm:px-2">
                    ·
                  </span>
                  <span className="text-text-tertiary">Template </span>
                  <span className="font-medium text-text-secondary">{templateTitle}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="ml-1 shrink-0 pl-1 sm:ml-2 sm:pl-2">
            <SchoolDetailUtilityActions />
          </div>
        </div>
      </header>

      {tableGroups.map((g) => (
        <ManagementTableGroupSection
          key={g.id}
          orgId={orgId}
          schoolId={schoolId}
          definitionId={bundleQuery.data?.definition.id ?? ""}
          instanceId={instanceId}
          groupId={g.id}
          groupTitle={isGhostOpsTable ? "Ghost Ops" : g.title}
          columns={columns}
          parentEnabled={enabled && Boolean(bundleQuery.data)}
          appearance={isGhostOpsTable ? "ghostOps" : "default"}
          boardTabLabel={isGhostOpsTable ? "Ghost Ops" : undefined}
          onOpenAddColumn={addColumn.openFromButton}
          onOpenGhost={
            isGhostOpsTable
              ? (id) => {
                  setGhostId(id);
                  setGhostOpen(true);
                }
              : undefined
          }
        />
      ))}

      <div className="mt-10">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={createTableGroupMutation.isPending || !bundleQuery.data}
          onClick={openNewTableGroupDialog}
        >
          <Table2 className="size-4" aria-hidden />
          New table group
        </Button>
      </div>

      {isGhostOpsTable && ghostHostWorkspaceItemId ? (
        <GhostDrawer
          open={ghostOpen}
          canMutate={enabled}
          ghostId={ghostId}
          host={{
            orgId,
            schoolId,
            hostType: "course",
            hostWorkspaceItemId: ghostHostWorkspaceItemId,
          }}
          onClose={() => setGhostOpen(false)}
        />
      ) : null}

      {newGroupDialogOpen ? (
        <>
          <DialogOverlay
            onClose={() => !createTableGroupMutation.isPending && setNewGroupDialogOpen(false)}
          />
          <div className="fixed inset-0 z-[3500] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-md px-5 py-4" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-semibold text-text-primary">New table group</h3>
              <p className="mt-1 text-xs text-text-tertiary">
                Adds another grid on this page. Columns stay shared with this management table.
              </p>
              <form
                className="mt-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  const t = newGroupTitle.trim();
                  if (!t || createTableGroupMutation.isPending) return;
                  createTableGroupMutation.mutate(t);
                }}
              >
                <label className="block text-sm font-medium text-text-secondary">
                  Group name
                  <input
                    value={newGroupTitle}
                    onChange={(e) => setNewGroupTitle(e.target.value)}
                    className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary outline-none focus:border-primary-500"
                    placeholder="e.g. Ghost management"
                    autoFocus
                  />
                </label>
                {createTableGroupMutation.isError ? (
                  <p className="mt-2 text-sm text-red-600" role="alert">
                    {createTableGroupMutation.error instanceof ApiError
                      ? createTableGroupMutation.error.message
                      : "Could not add group. Try again."}
                  </p>
                ) : null}
                <div className="mt-5 flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    disabled={createTableGroupMutation.isPending}
                    onClick={() => setNewGroupDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={createTableGroupMutation.isPending || !newGroupTitle.trim()}
                  >
                    Add group
                  </Button>
                </div>
              </form>
            </DialogPanel>
          </div>
        </>
      ) : null}

      <ManagementTableAddColumnPopover
        open={addColumn.open}
        anchor={addColumn.anchor}
        popoverRef={addColumn.popoverRef}
        search={addColumn.search}
        onSearchChange={addColumn.setSearch}
        groups={addColumnOptions}
        onPick={onPickAddColumnOption}
        pending={appendColumnMutation.isPending}
      />
    </div>
  );
}
