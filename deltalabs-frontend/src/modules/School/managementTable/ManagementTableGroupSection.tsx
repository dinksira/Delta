"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, SlidersHorizontal, Wrench } from "lucide-react";
import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/theme";
import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { ApiError } from "@/lib/apiClient";
import type {
  ManagementTableColumnDto,
  ManagementTableRowDto,
  ManagementTableRowListResponseDto,
  SchoolMemberSearchPicker,
} from "@/modules/School/api";
import {
  createManagementTableRow,
  deleteManagementTableRow,
  fetchManagementTableRows,
  moveManagementTableRow,
  patchManagementTableRowCells,
  updateSchoolGhost,
} from "@/modules/School/api";
import { ManagementTableCellEditor } from "@/modules/School/managementTable/ManagementTableCellEditor";
import {
  columnUsesPersonPicker,
  formatPersonCellLabel,
  resolvePersonPickerForColumn,
} from "@/modules/School/managementTable/managementTablePersonCell";
import {
  columnUsesClassSessionPicker,
  formatClassSessionCellLabel,
} from "@/modules/School/managementTable/managementTableClassSessionCell";
import {
  isGhostDeepLink,
  parseGhostDeepLink,
} from "@/modules/School/managementTable/managementTableGhostCell";
import {
  applyGhostOpsStatusChange,
  ghostOpsStatusNeedsNote,
  ghostOpsStatusNoteCopy,
  type GhostOpsStatusNoteKind,
} from "@/modules/School/managementTable/managementTableGhostOpsStatus";
import { GhostStatusNoteModal } from "@/modules/School/ghost/GhostStatusNoteModal";
import { ManagementTableGhostRequirementsCell } from "@/modules/School/managementTable/ManagementTableGhostRequirementsCell";
import { isGhostRequirementsColumn } from "@/modules/School/managementTable/managementTableGhostRequirements";
import { flattenManagementTableRows, groupHierarchyBlocks } from "@/modules/School/managementTable/managementTableRowHierarchy";
import { ManagementTableBoardViewsPopover } from "@/modules/School/managementTable/ManagementTableBoardViewsPopover";
import { ManagementTableColumnHeadCell } from "@/modules/School/managementTable/ManagementTableColumnHeadCell";
import { ManagementTableSelectionBar } from "@/modules/School/managementTable/ManagementTableSelectionBar";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export type ScheduleTableChrome = Readonly<{
  activeView: "main" | "calendar";
  onViewChange: (view: "main" | "calendar") => void;
  dateRangeLabel: string;
  onDateRangePrev?: () => void;
  onDateRangeNext?: () => void;
  /** Calendar view has its own toolbar — hide duplicate week controls in the group header. */
  hideToolbarDateRange?: boolean;
  calendarContent: React.ReactNode;
}>;

export type ManagementTableGroupSectionProps = Readonly<{
  orgId: string;
  schoolId: string;
  definitionId: string;
  instanceId: string;
  groupId: string;
  groupTitle: string;
  columns: readonly ManagementTableColumnDto[];
  parentEnabled: boolean;
  onOpenAddColumn: (anchor: HTMLButtonElement) => void;
  personPicker?: SchoolMemberSearchPicker;
  classWorkspaceItemId?: string;
  /** When false, hide Add row — e.g. leave requests submitted by students only. */
  allowAddRow?: boolean;
  emptyRowsMessage?: string;
  /** When set, only these column titles are editable (case-insensitive). Others are read-only. */
  onlyEditableColumnTitles?: readonly string[];
  /** Class schedule — Main Table / Calendar tabs, date range, calendar body. */
  scheduleChrome?: ScheduleTableChrome;
  /** Click handler for `ghost:{id}` deep-link cells (Open ghost column / link type). */
  onOpenGhost?: (ghostId: string) => void;
  /** Ghost Ops: open the linked exercise/test workspace (end-node draft). */
  onOpenWork?: (openKey: string) => void;
  /** When Status needs a file upload first (image/document variants). */
  onOpenUploadWork?: (args: { ghostId: string; variantId: string }) => void;
  /** Visual variant — ghost ops board uses distinct chrome from generic tables. */
  appearance?: "default" | "ghostOps";
  /** Label for the board tab under the group header (default: Main Table). */
  boardTabLabel?: string;
  /** Hide date-range / tag / tools chrome (ghost ops uses a leaner header). */
  hideUtilityChrome?: boolean;
}>;

export function ManagementTableGroupSection({
  orgId,
  schoolId,
  definitionId,
  instanceId,
  groupId,
  groupTitle,
  columns,
  parentEnabled,
  onOpenAddColumn,
  personPicker = "school_students",
  classWorkspaceItemId,
  allowAddRow = true,
  emptyRowsMessage = "No rows yet.",
  onlyEditableColumnTitles,
  scheduleChrome,
  onOpenGhost,
  onOpenWork,
  onOpenUploadWork,
  appearance = "default",
  boardTabLabel,
  hideUtilityChrome = false,
}: ManagementTableGroupSectionProps) {
  const queryClient = useQueryClient();
  const regionId = useId();
  const boardViewsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [boardViewsOpen, setBoardViewsOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  /** Rows whose subitems are visible. Empty = all parents collapsed (default). */
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set());
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [statusNotePending, setStatusNotePending] = useState<{
    openKey: unknown;
    nextStatus: string;
    kind: NonNullable<GhostOpsStatusNoteKind>;
  } | null>(null);
  const [statusNoteBusy, setStatusNoteBusy] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const enabled = parentEnabled && Boolean(groupId);
  const isGhostOps = appearance === "ghostOps";
  const resolvedBoardTab = boardTabLabel ?? (isGhostOps ? "Ghost Ops" : "Main Table");
  const hideChrome = hideUtilityChrome || isGhostOps;

  useEffect(() => {
    setSelectedRowIds(new Set());
    setExpandedRowIds(new Set());
    setDeleteConfirmOpen(false);
  }, [groupId, instanceId]);

  const rowsQuery = useQuery({
    queryKey: schoolQueryKeys.managementTableRows(orgId, schoolId, instanceId, groupId, 1),
    queryFn: () => fetchManagementTableRows(orgId, schoolId, instanceId, 1, 500, groupId),
    enabled,
  });

  const invalidateRows = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  }, [queryClient, orgId, schoolId, instanceId]);

  const addRowMutation = useMutation({
    mutationFn: () => createManagementTableRow(orgId, schoolId, instanceId, groupId),
    onSuccess: invalidateRows,
  });

  const patchRowMutation = useMutation({
    mutationFn: ({ rowId, cells }: { rowId: string; cells: Record<string, unknown> }) =>
      patchManagementTableRowCells(orgId, schoolId, instanceId, rowId, cells),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        schoolQueryKeys.managementTableRows(orgId, schoolId, instanceId, groupId, 1),
        (prev: ManagementTableRowListResponseDto | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((r) => (r.id === updated.id ? updated : r)),
          };
        },
      );
    },
  });

  const deleteRowsMutation = useMutation({
    mutationFn: async (rowIds: string[]) => {
      if (isGhostOps) {
        const latestRows = rowsQuery.data?.items ?? [];
        const byId = new Map(latestRows.map((r) => [r.id, r]));
        const ghostIds = new Set<string>();
        for (const id of rowIds) {
          const row = byId.get(id);
          if (!row) continue;
          for (const value of Object.values(row.cells)) {
            const gid = parseGhostDeepLink(value);
            if (gid) ghostIds.add(gid);
          }
        }
        if (ghostIds.size === 0) {
          throw new Error("Could not resolve ghost ids for the selected rows.");
        }
        for (const ghostId of ghostIds) {
          await updateSchoolGhost(orgId, schoolId, ghostId, { status: "cancelled" });
        }
        // Belt-and-suspenders: remove mirror rows even if sync cleanup missed them.
        for (const id of rowIds) {
          try {
            await deleteManagementTableRow(orgId, schoolId, instanceId, id);
          } catch {
            /* already removed by cascade / sync */
          }
        }
        return;
      }
      for (const id of rowIds) {
        await deleteManagementTableRow(orgId, schoolId, instanceId, id);
      }
    },
    onSuccess: async () => {
      setSelectedRowIds(new Set());
      setDeleteConfirmOpen(false);
      await invalidateRows();
      if (isGhostOps) {
        await queryClient.invalidateQueries({
          queryKey: ["school", "ghosts", orgId, schoolId],
        });
      }
    },
  });

  const moveRowMutation = useMutation({
    mutationFn: ({ rowId, direction }: { rowId: string; direction: "up" | "down" }) =>
      moveManagementTableRow(orgId, schoolId, instanceId, rowId, direction),
    onSuccess: invalidateRows,
  });

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const rows = rowsQuery.data?.items ?? [];
  const flatRows = useMemo(
    () => flattenManagementTableRows(rows, expandedRowIds),
    [rows, expandedRowIds],
  );
  const hierarchyBlocks = useMemo(() => groupHierarchyBlocks(flatRows), [flatRows]);
  const rootRowCount = useMemo(
    () => rows.filter((r) => !r.parentRowId || !rows.some((x) => x.id === r.parentRowId)).length,
    [rows],
  );
  const rowsById = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  /** Direct child counts for the badge — works while the parent is collapsed. */
  const directChildCountByParent = useMemo(() => {
    const counts = new Map<string, number>();
    const idSet = new Set(rows.map((r) => r.id));
    for (const row of rows) {
      const parent = row.parentRowId?.trim();
      if (!parent || !idSet.has(parent)) continue;
      counts.set(parent, (counts.get(parent) ?? 0) + 1);
    }
    return counts;
  }, [rows]);

  const isSyncedGhostRow = useCallback((row: ManagementTableRowDto) => {
    return Object.values(row.cells).some((value) => isGhostDeepLink(value));
  }, []);

  const toggleRowSelected = useCallback((rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const visibleRowIds = useMemo(() => flatRows.map((f) => f.row.id), [flatRows]);
  const allVisibleSelected =
    visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedRowIds.has(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedRowIds.has(id));

  const toggleSelectAllVisible = () => {
    setSelectedRowIds((prev) => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        for (const id of visibleRowIds) next.delete(id);
        return next;
      }
      const next = new Set(prev);
      for (const id of visibleRowIds) next.add(id);
      return next;
    });
  };

  const selectedList = useMemo(() => [...selectedRowIds], [selectedRowIds]);

  const selectionHasSyncedGhost = useMemo(() => {
    return selectedList.some((id) => {
      const row = rowsById.get(id);
      return row ? isSyncedGhostRow(row) : false;
    });
  }, [isSyncedGhostRow, rowsById, selectedList]);

  const canDeleteSelection =
    selectedList.length > 0 &&
    enabled &&
    (isGhostOps || !selectionHasSyncedGhost);

  const siblingMoveState = useMemo(() => {
    if (selectedList.length !== 1) {
      return { canMoveUp: false, canMoveDown: false };
    }
    const row = rowsById.get(selectedList[0]!);
    if (!row) return { canMoveUp: false, canMoveDown: false };
    const parentKey = row.parentRowId ?? null;
    const siblings = rows
      .filter((r) => (r.parentRowId ?? null) === parentKey)
      .slice()
      .sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    const index = siblings.findIndex((r) => r.id === row.id);
    return {
      canMoveUp: index > 0,
      canMoveDown: index >= 0 && index < siblings.length - 1,
    };
  }, [rows, rowsById, selectedList]);

  /** Prefer deleting ancestors only — BE cascades descendants. */
  const rowIdsToDelete = useMemo(() => {
    const selected = new Set(selectedList);
    return selectedList.filter((id) => {
      let parent = rowsById.get(id)?.parentRowId ?? null;
      while (parent) {
        if (selected.has(parent)) return false;
        parent = rowsById.get(parent)?.parentRowId ?? null;
      }
      return true;
    });
  }, [rowsById, selectedList]);

  const selectionBusy = deleteRowsMutation.isPending || moveRowMutation.isPending;

  const toggleRowExpanded = (rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const rowSummary = useMemo(() => {
    if (rowsQuery.isPending) return "Loading…";
    if (rowsQuery.isError) return "Could not load rows";
    if (rows.length === 0) return allowAddRow ? "No rows" : "No submissions";
    const nested = rows.length - rootRowCount;
    if (nested > 0) {
      if (rootRowCount === 1) return nested === 1 ? "1 item · 1 subitem" : `1 item · ${nested} subitems`;
      return `${rootRowCount} items · ${nested} subitems`;
    }
    if (rows.length === 1) return "1 row";
    return `${rows.length} rows`;
  }, [allowAddRow, rootRowCount, rows.length, rowsQuery.isError, rowsQuery.isPending]);

  const runGhostOpsStatus = async (openKey: unknown, nextStatus: string, note?: string) => {
    const result = await applyGhostOpsStatusChange({
      orgId,
      schoolId,
      openKey,
      nextStatus,
      note,
    });
    if (result.openUploadWork) {
      onOpenUploadWork?.(result.openUploadWork);
      return;
    }
    if (!result.ok) return;
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
    });
  };

  const onCellCommit = (row: ManagementTableRowDto, columnId: string, next: unknown, immediate?: boolean) => {
    if (immediate === false) return;
    const col = columns.find((c) => c.id === columnId);
    const title = col?.title.trim().toLowerCase() ?? "";

    // Ghost Ops Status → ghost APIs + in-app note modal (never window.prompt).
    if (isGhostOps && title === "status" && typeof next === "string") {
      const openKey = Object.values(row.cells).find((v) => isGhostDeepLink(v));
      const noteKind = ghostOpsStatusNeedsNote(next);
      if (noteKind) {
        setStatusError(null);
        setStatusNotePending({ openKey, nextStatus: next, kind: noteKind });
        return;
      }
      void (async () => {
        try {
          await runGhostOpsStatus(openKey, next);
        } catch (err) {
          setStatusError(
            err instanceof ApiError
              ? err.message
              : err instanceof Error
                ? err.message
                : "Could not update status.",
          );
        }
      })();
      return;
    }

    patchRowMutation.mutate({ rowId: row.id, cells: { [columnId]: next } });
  };

  const isColumnEditable = (col: ManagementTableColumnDto) => {
    if (!parentEnabled) return false;
    if (!onlyEditableColumnTitles?.length) return true;
    const title = col.title.trim().toLowerCase();
    return onlyEditableColumnTitles.some((t) => t.trim().toLowerCase() === title);
  };

  const formatReadOnlyCell = (col: ManagementTableColumnDto, value: unknown) => {
    if (isGhostDeepLink(value)) return "Open";
    if (col.type === "status" || col.type === "dropdown") {
      const opts = col.settings?.options;
      if (Array.isArray(opts)) {
        const id = typeof value === "string" ? value : "";
        const match = opts.find((o) => o && typeof o === "object" && "id" in o && String((o as { id: unknown }).id) === id);
        if (match && typeof match === "object" && "label" in match) return String((match as { label: unknown }).label);
      }
    }
    if (columnUsesPersonPicker(col)) return formatPersonCellLabel(value) || "—";
    if (columnUsesClassSessionPicker(col)) return formatClassSessionCellLabel(value) || "—";
    if (value === null || value === undefined || value === "") return "—";
    return String(value);
  };

  const renderDataCell = (row: ManagementTableRowDto, col: ManagementTableColumnDto) => {
    if (isGhostRequirementsColumn(col.title) && orgId) {
      return <ManagementTableGhostRequirementsCell orgId={orgId} value={row.cells[col.id]} />;
    }
    if (isColumnEditable(col)) {
      return (
        <ManagementTableCellEditor
          column={col}
          value={row.cells[col.id]}
          orgId={orgId}
          schoolId={schoolId}
          personPicker={resolvePersonPickerForColumn(col, personPicker)}
          classWorkspaceItemId={classWorkspaceItemId}
          onOpenGhost={onOpenGhost}
          onOpenWork={onOpenWork}
          onCommit={(next, imm) => onCellCommit(row, col.id, next, imm)}
        />
      );
    }
    if (isGhostDeepLink(row.cells[col.id])) {
      const cellValue = row.cells[col.id];
      const id = parseGhostDeepLink(cellValue);
      const showWork = Boolean(onOpenWork && id && isGhostDeepLink(cellValue));
      return (
        <div className="flex flex-wrap items-center gap-1 px-0.5">
          <button
            type="button"
            className="inline-flex h-7 items-center rounded px-1 text-sm font-semibold text-primary-800 underline-offset-2 hover:bg-primary-50 hover:underline"
            onClick={() => {
              if (id) onOpenGhost?.(id);
            }}
          >
            Ghost
          </button>
          {showWork ? (
            <button
              type="button"
              className="inline-flex h-7 items-center rounded px-1 text-sm font-semibold text-[#2f5d73] underline-offset-2 hover:bg-[#eef4f8] hover:underline"
              onClick={() => {
                if (typeof cellValue === "string") onOpenWork?.(cellValue);
              }}
            >
              Work
            </button>
          ) : null}
        </div>
      );
    }
    return (
      <span className="block truncate px-1 text-sm leading-7 text-text-primary" title={formatReadOnlyCell(col, row.cells[col.id])}>
        {formatReadOnlyCell(col, row.cells[col.id])}
      </span>
    );
  };

  const colSpanAll = sortedColumns.length + 2;

  return (
    <div className={["mt-10 first:mt-8", isGhostOps ? "rounded-2xl ring-1 ring-[#9eb6c4]/60" : ""].join(" ")}>
      <div
        className={[
          "flex min-h-[2.75rem] items-stretch overflow-hidden rounded-t-xl border",
          expanded
            ? "border-transparent border-b-0 bg-transparent shadow-none"
            : isGhostOps
              ? "rounded-b-xl border-[#b7c9d4] bg-[#d7e4ec] shadow-sm"
              : "rounded-b-xl border-border-default bg-[#cfd9e4] shadow-sm",
        ].join(" ")}
      >
        <button
          type="button"
          className={[
            "flex min-w-0 flex-1 items-center gap-2.5 px-2.5 py-2 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500",
            expanded ? "hover:bg-black/[0.03]" : "hover:bg-black/[0.04]",
          ].join(" ")}
          aria-expanded={expanded}
          aria-controls={regionId}
          onClick={() => setExpanded((v) => !v)}
        >
          <span
            className={[
              "w-1 shrink-0 self-stretch rounded-full",
              isGhostOps ? "bg-[#2f5d73]" : "bg-primary-500",
            ].join(" ")}
            aria-hidden
          />
          <ChevronDown
            className={[
              "size-4 shrink-0 text-text-secondary transition-transform duration-200 ease-out",
              expanded ? "rotate-0" : "-rotate-90",
            ].join(" ")}
            aria-hidden
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
              <span className="text-lg font-semibold leading-tight text-text-primary">
                <span className="mr-1 text-text-tertiary">#</span>
                {groupTitle}
              </span>
              {isGhostOps ? (
                <span className="rounded-md bg-[#2f5d73] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                  Ghost
                </span>
              ) : null}
            </div>
            <p className="mt-px text-[11px] leading-tight text-text-tertiary">{rowSummary}</p>
          </div>
        </button>
        {!hideChrome ? (
        <div
          className={[
            "flex shrink-0 flex-wrap items-center justify-end gap-1.5 border-l px-2 py-1.5 sm:px-2.5",
            expanded ? "border-l-transparent bg-transparent" : "border-border-default bg-[#cfd9e4]/90",
          ].join(" ")}
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-default px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-muted sm:px-4 sm:py-2"
            title={scheduleChrome && !scheduleChrome.hideToolbarDateRange ? "Previous week" : "Coming soon"}
            onClick={
              scheduleChrome && !scheduleChrome.hideToolbarDateRange
                ? () => {
                    scheduleChrome.onDateRangePrev?.();
                  }
                : undefined
            }
            disabled={!scheduleChrome || scheduleChrome.hideToolbarDateRange}
            hidden={Boolean(scheduleChrome?.hideToolbarDateRange)}
          >
            {scheduleChrome?.dateRangeLabel ?? "1th January ↔ 7th January"}
          </button>
          {scheduleChrome && !scheduleChrome.hideToolbarDateRange ? (
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-default px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-muted sm:px-4 sm:py-2"
              title="Next week"
              onClick={() => scheduleChrome.onDateRangeNext?.()}
            >
              →
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-default px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-muted sm:px-4 sm:py-2"
            title="Coming soon"
          >
            <SlidersHorizontal className="size-3.5 text-text-tertiary" aria-hidden />
            # Table Tag
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-default px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-muted sm:px-4 sm:py-2"
            title="Coming soon"
          >
            <Wrench className="size-3.5 text-text-tertiary" aria-hidden />
            Tools
          </button>
        </div>
        ) : null}
      </div>

      {expanded ? (
        <div
          id={regionId}
          className={[
            "rounded-b-xl border border-t-0 bg-surface-default shadow-sm",
            isGhostOps ? "border-[#b7c9d4]" : "border-border-default",
          ].join(" ")}
        >
      {!isGhostOps || scheduleChrome ? (
      <div
        className={[
          "flex min-h-[44px] items-center gap-6 border-b px-3 pb-px pt-3",
          isGhostOps ? "border-[#d5e2ea] bg-[#f3f7fa]" : "border-border-default bg-surface-default",
        ].join(" ")}
      >
        {scheduleChrome ? (
          <>
            <button
              type="button"
              className={[
                "pb-2 text-sm font-semibold transition-colors",
                scheduleChrome.activeView === "main"
                  ? "border-b-2 border-primary-600 text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary",
              ].join(" ")}
              onClick={() => scheduleChrome.onViewChange("main")}
            >
              Main Table
            </button>
            <button
              type="button"
              className={[
                "pb-2 text-sm font-semibold transition-colors",
                scheduleChrome.activeView === "calendar"
                  ? "border-b-2 border-primary-600 text-text-primary"
                  : "text-text-tertiary hover:text-text-secondary",
              ].join(" ")}
              onClick={() => scheduleChrome.onViewChange("calendar")}
            >
              Calendar
            </button>
          </>
        ) : (
          <span className="border-b-2 border-primary-600 pb-2 text-sm font-semibold text-text-primary">
            {resolvedBoardTab}
          </span>
        )}
        <button
          ref={boardViewsAnchorRef}
          type="button"
          className="pb-2 text-lg font-medium leading-none text-text-tertiary transition-colors hover:text-text-secondary"
          aria-label="Board views"
          aria-expanded={boardViewsOpen}
          aria-haspopup="dialog"
          title="Switch board view"
          onClick={() => setBoardViewsOpen((o) => !o)}
        >
          +
        </button>
        <ManagementTableBoardViewsPopover
          open={boardViewsOpen}
          onClose={() => setBoardViewsOpen(false)}
          anchorRef={boardViewsAnchorRef}
        />
      </div>
      ) : null}

      {scheduleChrome?.activeView === "calendar" ? (
        scheduleChrome.calendarContent
      ) : (
      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#e8edf3] text-left text-text-secondary">
              <th className="sticky left-0 z-[4] w-10 border-b border-r border-white bg-[#e8edf3] px-1 py-1 shadow-[2px_0_10px_rgba(2,24,43,0.08)]">
                <input
                  type="checkbox"
                  className="ml-5 size-3.5 rounded border-border-default"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                  }}
                  disabled={!enabled || visibleRowIds.length === 0}
                  aria-label="Select all visible rows"
                  onChange={toggleSelectAllVisible}
                />
              </th>
              {sortedColumns.map((col) => (
                <th
                  key={col.id}
                  className="group/colhead relative min-w-[120px] border-b border-l border-white p-0 font-medium align-middle"
                >
                  <ManagementTableColumnHeadCell
                    orgId={orgId}
                    schoolId={schoolId}
                    definitionId={definitionId}
                    instanceId={instanceId}
                    column={col}
                    columnCount={sortedColumns.length}
                    enabled={enabled}
                  />
                </th>
              ))}
              <th className="sticky right-0 z-[4] min-w-[120px] border-b border-l border-white bg-[#e8edf3] px-1 py-1 font-medium shadow-[-2px_0_10px_rgba(2,24,43,0.08)]">
                <button
                  type="button"
                  className="inline-flex h-7 w-full items-center gap-1.5 rounded-md px-1 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-white/60"
                  onClick={(e) => onOpenAddColumn(e.currentTarget)}
                  disabled={!enabled}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-border-default bg-surface-default text-text-secondary">
                    <Plus className="size-3" aria-hidden />
                  </span>
                  Add column
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rowsQuery.isPending ? (
              <tr>
                <td colSpan={colSpanAll} className="px-3 py-6 text-center text-text-tertiary">
                  Loading rows…
                </td>
              </tr>
            ) : rowsQuery.isError ? (
              <tr>
                <td colSpan={colSpanAll} className="px-3 py-6 text-center text-sm text-red-600">
                  {rowsQuery.error instanceof ApiError ? rowsQuery.error.message : "Could not load rows."}
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={colSpanAll} className="px-3 py-8 text-center text-sm text-text-tertiary">
                  {emptyRowsMessage}
                </td>
              </tr>
            ) : (
              hierarchyBlocks.map(({ parent, descendants }) => {
                const parentExpanded = parent.hasChildren && expandedRowIds.has(parent.row.id);
                const childCount = directChildCountByParent.get(parent.row.id) ?? 0;
                const parentSelected = selectedRowIds.has(parent.row.id);
                return (
                  <Fragment key={parent.row.id}>
                    <tr
                      className={[
                        "group/row hover:bg-surface-muted/30",
                        parentSelected ? "bg-primary-50/50" : "",
                      ].join(" ")}
                    >
                      <td
                        className={[
                          "sticky left-0 z-[2] h-9 border-b border-r border-border-default px-1 align-middle shadow-[2px_0_10px_rgba(2,24,43,0.06)]",
                          parentSelected
                            ? "bg-primary-50/50 group-hover/row:bg-primary-50/70"
                            : "bg-surface-default group-hover/row:bg-surface-muted/30",
                        ].join(" ")}
                      >
                        <div className="flex items-center gap-0.5">
                          {parent.hasChildren ? (
                            <button
                              type="button"
                              className="inline-flex size-5 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-black/[0.06]"
                              aria-expanded={parentExpanded}
                              aria-label={parentExpanded ? "Collapse subitems" : "Expand subitems"}
                              onClick={() => toggleRowExpanded(parent.row.id)}
                            >
                              <ChevronDown
                                className={[
                                  "size-3.5 transition-transform",
                                  parentExpanded ? "rotate-0" : "-rotate-90",
                                ].join(" ")}
                                aria-hidden
                              />
                            </button>
                          ) : (
                            <span className="inline-block size-5 shrink-0" aria-hidden />
                          )}
                          <input
                            type="checkbox"
                            className="size-3.5 rounded border-border-default"
                            checked={parentSelected}
                            disabled={!enabled}
                            aria-label="Select row"
                            onChange={() => toggleRowSelected(parent.row.id)}
                          />
                        </div>
                      </td>
                      {sortedColumns.map((col, colIndex) => (
                        <td
                          key={col.id}
                          className={[
                            "h-9 border-b border-l border-border-default px-1 align-middle",
                            parentSelected
                              ? "bg-primary-50/50 group-hover/row:bg-primary-50/70"
                              : "bg-surface-default group-hover/row:bg-surface-muted/30",
                          ].join(" ")}
                        >
                          <div className="flex min-w-0 items-center gap-1.5">
                            {colIndex === 0 && childCount > 0 ? (
                              <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[#dbe7ef] px-1.5 text-[10px] font-bold text-[#2f5d73]">
                                {childCount}
                              </span>
                            ) : null}
                            <div className="min-w-0 flex-1">{renderDataCell(parent.row, col)}</div>
                          </div>
                        </td>
                      ))}
                      <td
                        className={[
                          "sticky right-0 z-[2] h-9 border-b border-l border-border-default shadow-[-2px_0_10px_rgba(2,24,43,0.06)]",
                          parentSelected
                            ? "bg-primary-50/50 group-hover/row:bg-primary-50/70"
                            : "bg-surface-default group-hover/row:bg-surface-muted/30",
                        ].join(" ")}
                      />
                    </tr>

                    {parentExpanded ? (
                      <tr>
                        <td
                          colSpan={colSpanAll}
                          className="border-b border-border-default bg-surface-default p-0"
                        >
                          {/* Nested subitem board — inset so main grid lines do not run through the gutter */}
                          <div className="py-2 pl-10 pr-3">
                            <div className="overflow-hidden rounded-lg border border-[#b8cddc] bg-[#f7fafc] shadow-[0_1px_2px_rgba(2,24,43,0.04)]">
                              <div className="flex min-w-0">
                                <span
                                  className="w-1.5 shrink-0 bg-[#5b9fd4]"
                                  aria-hidden
                                />
                                <div className="min-w-0 flex-1 overflow-x-auto">
                                  <table className="min-w-full border-separate border-spacing-0 text-sm">
                                    <thead>
                                      <tr className="bg-[#e7f0f6] text-left text-[#5a7184]">
                                        <th className="w-9 border-b border-[#d5e3ee] px-1 py-1.5">
                                          <span className="sr-only">Select</span>
                                        </th>
                                        {sortedColumns.map((col, colIndex) => (
                                          <th
                                            key={`subhead-${parent.row.id}-${col.id}`}
                                            className="min-w-[120px] border-b border-l border-[#d5e3ee] px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide"
                                          >
                                            {colIndex === 0 ? "Subitem" : col.title}
                                          </th>
                                        ))}
                                        <th className="min-w-[40px] border-b border-l border-[#d5e3ee] px-1 py-1.5" />
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {descendants.map((child, childIndex) => {
                                        const isLast = childIndex === descendants.length - 1;
                                        const rowBorder = isLast ? "" : "border-b border-[#e3ebf1]";
                                        const childSelected = selectedRowIds.has(child.row.id);
                                        return (
                                          <tr
                                            key={child.row.id}
                                            className={[
                                              "group/sub hover:bg-[#eef5fa]",
                                              childSelected ? "bg-[#dceaf4]" : "",
                                            ].join(" ")}
                                          >
                                            <td
                                              className={[
                                                "h-9 px-1 align-middle",
                                                childSelected
                                                  ? "bg-[#dceaf4] group-hover/sub:bg-[#d3e4f0]"
                                                  : "bg-[#f7fafc] group-hover/sub:bg-[#eef5fa]",
                                                rowBorder,
                                              ].join(" ")}
                                            >
                                              <div
                                                className="flex items-center gap-0.5"
                                                style={{
                                                  paddingLeft: Math.max(0, child.depth - 1) * 14,
                                                }}
                                              >
                                                {child.hasChildren ? (
                                                  <button
                                                    type="button"
                                                    className="inline-flex size-5 shrink-0 items-center justify-center rounded text-text-tertiary hover:bg-black/[0.05]"
                                                    aria-expanded={expandedRowIds.has(child.row.id)}
                                                    aria-label={
                                                      expandedRowIds.has(child.row.id)
                                                        ? "Collapse nested variants"
                                                        : "Expand nested variants"
                                                    }
                                                    onClick={() => toggleRowExpanded(child.row.id)}
                                                  >
                                                    <ChevronDown
                                                      className={[
                                                        "size-3.5 transition-transform",
                                                        expandedRowIds.has(child.row.id)
                                                          ? "rotate-0"
                                                          : "-rotate-90",
                                                      ].join(" ")}
                                                      aria-hidden
                                                    />
                                                  </button>
                                                ) : (
                                                  <span className="inline-block size-5 shrink-0" aria-hidden />
                                                )}
                                                <input
                                                  type="checkbox"
                                                  className="size-3.5 rounded border-border-default"
                                                  checked={childSelected}
                                                  disabled={!enabled}
                                                  aria-label="Select subitem"
                                                  onChange={() => toggleRowSelected(child.row.id)}
                                                />
                                              </div>
                                            </td>
                                            {sortedColumns.map((col) => (
                                              <td
                                                key={col.id}
                                                className={[
                                                  "h-9 border-l border-[#e3ebf1] px-1 align-middle",
                                                  childSelected
                                                    ? "bg-[#dceaf4] group-hover/sub:bg-[#d3e4f0]"
                                                    : "bg-[#f7fafc] group-hover/sub:bg-[#eef5fa]",
                                                  rowBorder,
                                                ].join(" ")}
                                              >
                                                {renderDataCell(child.row, col)}
                                              </td>
                                            ))}
                                            <td
                                              className={[
                                                "h-9 border-l border-[#e3ebf1]",
                                                childSelected
                                                  ? "bg-[#dceaf4] group-hover/sub:bg-[#d3e4f0]"
                                                  : "bg-[#f7fafc] group-hover/sub:bg-[#eef5fa]",
                                                rowBorder,
                                              ].join(" ")}
                                            />
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </Fragment>
                );
              })
            )}
          </tbody>
        </table>
        {allowAddRow ? (
          <div className="border-t border-border-default bg-surface-muted/30 px-1.5 py-1.5">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1 text-xs"
              disabled={addRowMutation.isPending || !enabled}
              onClick={() => addRowMutation.mutate()}
            >
              <Plus className="size-3.5" aria-hidden />
              Add row
            </Button>
          </div>
        ) : null}
      </div>
      )}
        </div>
      ) : null}

      {selectedList.length > 0 ? (
        <ManagementTableSelectionBar
          selectedCount={selectedList.length}
          canDelete={canDeleteSelection}
          deleteDisabledReason={
            !isGhostOps && selectionHasSyncedGhost
              ? "Ghost Ops rows are managed from the Ghost drawer and would return on sync."
              : isGhostOps
                ? "Cancels the ghost work-order and removes it from this board."
                : undefined
          }
          canMoveUp={enabled && siblingMoveState.canMoveUp}
          canMoveDown={enabled && siblingMoveState.canMoveDown}
          busy={selectionBusy}
          onClear={() => setSelectedRowIds(new Set())}
          onDelete={() => {
            if (!canDeleteSelection || rowIdsToDelete.length === 0) return;
            setDeleteConfirmOpen(true);
          }}
          onMoveUp={() => {
            const id = selectedList[0];
            if (!id || !siblingMoveState.canMoveUp) return;
            moveRowMutation.mutate({ rowId: id, direction: "up" });
          }}
          onMoveDown={() => {
            const id = selectedList[0];
            if (!id || !siblingMoveState.canMoveDown) return;
            moveRowMutation.mutate({ rowId: id, direction: "down" });
          }}
        />
      ) : null}

      {statusError ? (
        <p className="fixed bottom-[7.5rem] left-1/2 z-[190] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          {statusError}
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setStatusError(null)}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <GhostStatusNoteModal
        open={Boolean(statusNotePending)}
        title={statusNotePending ? ghostOpsStatusNoteCopy(statusNotePending.kind).title : ""}
        description={
          statusNotePending ? ghostOpsStatusNoteCopy(statusNotePending.kind).description : ""
        }
        confirmLabel={
          statusNotePending ? ghostOpsStatusNoteCopy(statusNotePending.kind).confirmLabel : "Continue"
        }
        required={statusNotePending ? ghostOpsStatusNoteCopy(statusNotePending.kind).required : false}
        confirmTone={
          statusNotePending ? ghostOpsStatusNoteCopy(statusNotePending.kind).confirmTone : "primary"
        }
        pending={statusNoteBusy}
        onCancel={() => {
          if (statusNoteBusy) return;
          setStatusNotePending(null);
        }}
        onConfirm={(note) => {
          if (!statusNotePending) return;
          const pending = statusNotePending;
          setStatusNoteBusy(true);
          void (async () => {
            try {
              await runGhostOpsStatus(pending.openKey, pending.nextStatus, note);
              setStatusNotePending(null);
            } catch (err) {
              setStatusError(
                err instanceof ApiError
                  ? err.message
                  : err instanceof Error
                    ? err.message
                    : "Could not update status.",
              );
            } finally {
              setStatusNoteBusy(false);
            }
          })();
        }}
      />

      <SchoolConfirmActionModal
        open={deleteConfirmOpen && rowIdsToDelete.length > 0}
        title={isGhostOps ? "Cancel ghost work?" : "Delete rows?"}
        description={
          isGhostOps
            ? rowIdsToDelete.length === 1
              ? "This cancels the ghost work-order and removes it from Ghost Ops."
              : `This cancels ${rowIdsToDelete.length} ghost work-orders and removes them from Ghost Ops.`
            : rowIdsToDelete.length === 1
              ? "This permanently deletes the selected row and its subitems."
              : `This permanently deletes ${rowIdsToDelete.length} rows and their subitems.`
        }
        confirmLabel={isGhostOps ? "Cancel ghosts" : "Delete"}
        confirmTone="danger"
        pending={deleteRowsMutation.isPending}
        onCancel={() => {
          if (deleteRowsMutation.isPending) return;
          setDeleteConfirmOpen(false);
        }}
        onConfirm={() => {
          if (!canDeleteSelection || rowIdsToDelete.length === 0) return;
          deleteRowsMutation.mutate(rowIdsToDelete);
        }}
      />
      {deleteRowsMutation.isError ? (
        <p className="fixed bottom-[7.5rem] left-1/2 z-[190] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          {deleteRowsMutation.error instanceof ApiError
            ? deleteRowsMutation.error.message
            : deleteRowsMutation.error instanceof Error
              ? deleteRowsMutation.error.message
              : "Could not delete selection."}
        </p>
      ) : null}
    </div>
  );
}
