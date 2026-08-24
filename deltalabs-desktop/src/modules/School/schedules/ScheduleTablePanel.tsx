"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnDto, ManagementTableColumnTypeDto } from "@/modules/School/api";
import {
  appendManagementTableColumn,
  bootstrapSchedulesTableWorkspaceItem,
  createManagementTableRow,
  fetchManagementTableInstanceBundle,
  fetchManagementTableRows,
  patchManagementTableRowCells,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import {
  ClassScheduleCalendarView,
  type ScheduleCalendarSlotSelection,
} from "@/modules/School/schedules/ClassScheduleCalendarView";
import { readSchedulesTableInstanceId } from "@/modules/School/schedules/schedulesTableMeta";
import {
  addDays,
  buildScheduleCalendarEvents,
  formatMinutesAsTime,
  formatScheduleWeekRangeLabel,
  startOfWeekMonday,
} from "@/modules/School/schedules/scheduleCalendarUtils";
import { ManagementTableAddColumnPopover } from "@/modules/School/managementTable/ManagementTableAddColumnPopover";
import {
  CLASS_SCHEDULES_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/School/managementTable/columnTypeMeta";
import { ManagementTableGroupSection } from "@/modules/School/managementTable/ManagementTableGroupSection";
import { MANAGEMENT_TABLE_WORKSPACE_KIND } from "@/modules/School/managementTable/managementTableWorkspaceKind";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";
import { useManagementTableKindGuard } from "@/modules/School/managementTable/useManagementTableKindGuard";

function bootstrapErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 404) {
    return "The schedules-table API is not on the live server yet. Deploy the latest deltalabs-backend, then try again.";
  }
  if (error instanceof ApiError && error.status === 403) {
    return "You need school manage permission on this organization to create the schedule table.";
  }
  if (error instanceof ApiError) return error.message;
  return "Could not create schedule table. Check your connection and try again.";
}

function findColumnId(columns: readonly ManagementTableColumnDto[], title: string): string | null {
  const col = columns.find((c) => c.title.trim().toLowerCase() === title.trim().toLowerCase());
  return col?.id ?? null;
}

export function ScheduleTablePanel({
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
  const [instanceId, setInstanceId] = useState<string | null>(() => readSchedulesTableInstanceId(itemMetadata));
  const [scheduleView, setScheduleView] = useState<"main" | "calendar">("main");
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const addColumn = useManagementTableAddColumnPopover();

  useEffect(() => {
    setInstanceId(readSchedulesTableInstanceId(itemMetadata));
  }, [itemMetadata]);

  const bootstrapMutation = useMutation({
    mutationFn: () => bootstrapSchedulesTableWorkspaceItem(orgId, schoolId, workspaceItemId),
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
    tableKind: MANAGEMENT_TABLE_WORKSPACE_KIND.schedules,
    instanceId,
    bundle: bundleQuery.data,
    canMutate,
    bootstrapPending: bootstrapMutation.isPending,
    onRepair: repairTableBootstrap,
    isBundleValid: (bundle) =>
      bundle.definition.columns.some((col) => col.title.trim().toLowerCase() === "session"),
  });

  const mainGroup = bundleQuery.data?.instance.tableGroups?.[0] ?? { id: "mtg_main", title: "Main Table", order: 0 };
  const columns = bundleQuery.data?.definition.columns ?? [];

  const rowsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableRows(orgId, schoolId, instanceId ?? "none", mainGroup.id, 1),
    queryFn: () => fetchManagementTableRows(orgId, schoolId, instanceId!, 1, 500, mainGroup.id),
    enabled: Boolean(orgId && schoolId && instanceId),
    staleTime: 10_000,
  });

  const invalidateBundleAndRows = useCallback(async () => {
    if (!instanceId) return;
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  }, [instanceId, orgId, queryClient, schoolId]);

  const appendColumnMutation = useMutation({
    mutationFn: (input: { title: string; type: ManagementTableColumnTypeDto; settings: Record<string, unknown> }) =>
      appendManagementTableColumn(orgId, schoolId, bundleQuery.data!.definition.id, input),
    onSuccess: invalidateBundleAndRows,
  });

  const createAtSlotMutation = useMutation({
    mutationFn: async (slot: ScheduleCalendarSlotSelection) => {
      if (!instanceId) throw new Error("Missing schedule table.");
      const row = await createManagementTableRow(orgId, schoolId, instanceId, mainGroup.id);
      const cells: Record<string, unknown> = {};
      const dateColId = findColumnId(columns, "Date");
      const timeColId = findColumnId(columns, "Time");
      if (dateColId) cells[dateColId] = slot.dateKey;
      if (timeColId) cells[timeColId] = formatMinutesAsTime(slot.startMinutes);
      if (Object.keys(cells).length > 0) {
        await patchManagementTableRowCells(orgId, schoolId, instanceId, row.id, cells);
      }
      return row;
    },
    onSuccess: invalidateBundleAndRows,
  });

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(CLASS_SCHEDULES_TABLE_ADD_COLUMN_GROUPS, addColumn.search),
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

  const calendarEvents = useMemo(
    () => buildScheduleCalendarEvents(rowsQuery.data?.items ?? [], columns),
    [columns, rowsQuery.data?.items],
  );

  const handleCreateAtSlot = useCallback(
    (slot: ScheduleCalendarSlotSelection) => {
      if (!canMutate) return;
      createAtSlotMutation.mutate(slot);
    },
    [canMutate, createAtSlotMutation],
  );

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
          <p className="text-sm font-semibold text-text-primary">Schedule not set up</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            A school manager needs to open this tab once to create the class schedule.
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
          Create schedule
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
        {bundleQuery.error instanceof ApiError ? bundleQuery.error.message : "Could not load schedule."}
      </p>
    );
  }

  const definitionId = bundleQuery.data.definition.id;

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
        scheduleChrome={{
          activeView: scheduleView,
          onViewChange: setScheduleView,
          dateRangeLabel: formatScheduleWeekRangeLabel(weekStart),
          onDateRangePrev: () => setWeekStart((w) => addDays(w, -7)),
          onDateRangeNext: () => setWeekStart((w) => addDays(w, 7)),
          hideToolbarDateRange: scheduleView === "calendar",
          calendarContent: (
            <ClassScheduleCalendarView
              weekStart={weekStart}
              events={calendarEvents}
              columns={columns}
              canMutate={canMutate}
              loading={rowsQuery.isFetching || createAtSlotMutation.isPending}
              onWeekPrev={() => setWeekStart((w) => addDays(w, -7))}
              onWeekNext={() => setWeekStart((w) => addDays(w, 7))}
              onToday={() => setWeekStart(startOfWeekMonday(new Date()))}
              onCreateAtSlot={handleCreateAtSlot}
              onSwitchToTable={() => setScheduleView("main")}
            />
          ),
        }}
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
