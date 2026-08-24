"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnTypeDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  bootstrapAssignmentsTableWorkspaceItem,
  fetchManagementTableInstanceBundle,
} from "@/modules/School/api";
import { readAssignmentsTableInstanceId } from "@/modules/School/assignments/assignmentsTableMeta";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  CLASS_ASSIGNMENTS_TABLE_ADD_COLUMN_GROUPS,
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

function bootstrapErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "The assignments-table API is not on the live server yet. Deploy the latest deltalabs-backend, then try again.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "You need school manage permission on this organization to create the assignments table.";
  }
  if (error instanceof ApiError) return error.message;
  return "Could not create assignments table. Check your connection and try again.";
}

export function AssignmentsTablePanel({
  orgId,
  schoolId,
  workspaceItemId,
  itemMetadata,
  canMutate,
  onBootstrapped,
}: Readonly<{
  orgId: string;
  schoolId: string;
  workspaceItemId: string;
  itemMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
  onBootstrapped: () => void;
}>) {
  const queryClient = useQueryClient();
  const [instanceId, setInstanceId] = useState<string | null>(() => readAssignmentsTableInstanceId(itemMetadata));
  const addColumn = useManagementTableAddColumnPopover();

  useEffect(() => {
    setInstanceId(readAssignmentsTableInstanceId(itemMetadata));
  }, [itemMetadata]);

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapAssignmentsTableWorkspaceItem(orgId, schoolId, workspaceItemId),
    onSuccess: (data) => {
      setInstanceId(data.instance.id);
      onBootstrapped();
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, workspaceItemId),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, data.instance.id),
      });
    },
  });

  useEffect(() => {
    if (!canMutate || instanceId || bootstrapMutation.isPending) return;
    bootstrapMutation.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canMutate, instanceId]);

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
    tableKind: MANAGEMENT_TABLE_WORKSPACE_KIND.assignments,
    instanceId,
    bundle: bundleQuery.data,
    canMutate,
    bootstrapPending: bootstrapMutation.isPending,
    onRepair: repairTableBootstrap,
    isBundleValid: (bundle) =>
      bundle.definition.columns.some((col) => col.title.trim().toLowerCase() === "assignment"),
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
    mutationFn: (input: { title: string; type: ManagementTableColumnTypeDto; settings: Record<string, unknown> }) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, input),
    onSuccess: invalidateBundleAndRows,
  });

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(CLASS_ASSIGNMENTS_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) return;
    const type = opt.supportedType;
    appendColumnMutation.mutate(
      {
        title: opt.columnTitle ?? defaultTitleForColumnType(type),
        type,
        settings: opt.columnSettings ?? defaultSettingsForColumnType(type),
      },
      { onSettled: () => addColumn.close() },
    );
  };

  if (!instanceId) {
    if (bootstrapMutation.isPending) {
      return <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />;
    }
    if (!canMutate) {
      return (
        <div
          className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center"
          role="status"
        >
          <Table2 className="mb-3 size-8 text-text-tertiary" aria-hidden />
          <p className="text-sm font-semibold text-text-primary">Assignments not set up</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            A school manager needs to open this tab once to create the class assignments table.
          </p>
        </div>
      );
    }
    return (
      <div className="space-y-4">
        {bootstrapMutation.isError ? (
          <p className="text-sm text-red-600">{bootstrapErrorMessage(bootstrapMutation.error)}</p>
        ) : null}
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => bootstrapMutation.mutate()}
          disabled={bootstrapMutation.isPending}
        >
          Create assignments table
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
        {bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load assignments."}
      </p>
    );
  }

  const definitionId = bundleQuery.data.definition.id;
  const columns = bundleQuery.data.definition.columns;
  const mainGroup = bundleQuery.data.instance.tableGroups?.[0] ?? {
    id: "mtg_main",
    title: "Main Table",
    order: 0,
  };

  return (
    <section className="space-y-0">
      <ManagementTableGroupSection
        orgId={orgId}
        schoolId={schoolId}
        definitionId={definitionId}
        instanceId={instanceId}
        groupId={mainGroup.id}
        groupTitle={mainGroup.title}
        columns={columns}
        parentEnabled={canMutate}
        personPicker="school_teachers"
        classWorkspaceItemId={workspaceItemId}
        onOpenAddColumn={addColumn.openFromButton}
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
    </section>
  );
}
