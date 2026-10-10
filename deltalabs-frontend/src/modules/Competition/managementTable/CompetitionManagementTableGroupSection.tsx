/**
 * CompetitionManagementTableGroupSection
 *
 * Renders a Monday.com-style group board consistent with the School module:
 * - Collapsible group with row summary
 * - Sticky left index + select-all checkbox with indeterminate state
 * - Sticky right header with "+ Add column" trigger
 * - Sticky bottom row with "+ Add row"
 * - Sibling reordering (Move up / Move down)
 * - Delegation to modular subcomponents to stay strictly under 300 lines.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableGroupSection orgId="o" definitionId="d" instanceId="i" groupId="g" columns={[]} parentEnabled />
 * ```
 */

"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";

import { useCompetitionHubData } from "@/modules/Competition/hooks/useCompetitionHubData";
import {
  createCompetitionManagementTableRow,
  deleteCompetitionManagementTableRow,
  fetchCompetitionManagementTableRows,
  patchCompetitionManagementTableRow,
  patchTopicBattleManagementTableRow,
  populateManagementTableRowFromBattle,

} from "./api";
import type { CompetitionManagementTableRowDto } from "./types";
import { competitionQueryKeys } from "./competitionQueryKeys";
import { ManagementTableColumnHeadCell } from "./ManagementTableColumnHeadCell";
import { flattenManagementTableRows } from "./managementTableRowHierarchy";
import { CompetitionManagementTableGroupHeader } from "./CompetitionManagementTableGroupHeader";
import { CompetitionManagementTableGroupSummary } from "./CompetitionManagementTableGroupSummary";
import { CompetitionManagementTableRow } from "./CompetitionManagementTableRow";
import { resolveGroupColor } from "./columnTypeMeta";

// ===== TYPES =====

export interface CompetitionManagementTableGroupSectionProps {
  readonly orgId: string;
  readonly definitionId: string;
  readonly instanceId: string;
  readonly groupId: string;
  readonly groupTitle?: string;
  readonly groupColor?: string;
  readonly columns: readonly { id: string; title: string; type: string; order: number; settings?: Record<string, unknown> }[];
  readonly parentEnabled: boolean;
  readonly battleId?: string;
  readonly selectedRowIds?: ReadonlySet<string>;
  readonly onToggleSelectRow?: (rowId: string) => void;
  readonly onSelectAllInGroup?: (rowIds: string[], select: boolean) => void;
  readonly onOpenAddColumn?: (btn: HTMLButtonElement) => void;
  readonly onDeleteGroup?: () => void;
}

// ===== COMPONENT =====

export function CompetitionManagementTableGroupSection({
  orgId,
  definitionId,
  instanceId,
  groupId,
  groupTitle = "Main Table",
  groupColor = "primary",
  columns,
  parentEnabled,
  battleId,
  selectedRowIds = new Set(),
  onToggleSelectRow,
  onSelectAllInGroup,
  onOpenAddColumn,
  onDeleteGroup,
}: Readonly<CompetitionManagementTableGroupSectionProps>) {
  const queryClient = useQueryClient();
  const selectAllRef = useRef<HTMLInputElement | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirmRowId, setDeleteConfirmRowId] = useState<string | null>(null);
  const [linkPickerRowId, setLinkPickerRowId] = useState<string | null>(null);
  const { myBattles } = useCompetitionHubData();

  const enabled = parentEnabled && Boolean(groupId);

  const rowsQuery = useQuery({
    queryKey: competitionQueryKeys.rows(orgId, instanceId, groupId),
    queryFn: () => fetchCompetitionManagementTableRows(instanceId, groupId, 1, 200, orgId),
    enabled,
  });

  const invalidateRows = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.rows(orgId, instanceId, groupId),
    });
  }, [queryClient, orgId, instanceId, groupId]);

  const addRowMutation = useMutation({
    mutationFn: () => createCompetitionManagementTableRow(instanceId, groupId, orgId),
    onSuccess: invalidateRows,
  });

  const patchRowMutation = useMutation({

    mutationFn: ({ rowId, cells }: { rowId: string; cells: Record<string, unknown> }) =>
      battleId
        ? patchTopicBattleManagementTableRow(battleId, rowId, cells, orgId)
        : patchCompetitionManagementTableRow(instanceId, rowId, cells, orgId),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        competitionQueryKeys.rows(orgId, instanceId, groupId),
        (prev: { items: CompetitionManagementTableRowDto[] } | undefined) => {
          if (!prev) return prev;
          return { ...prev, items: prev.items.map((r) => (r.id === updated.id ? updated : r)) };
        },
      );
    },
  });

  const deleteRowMutation = useMutation({
    mutationFn: (rowId: string) => deleteCompetitionManagementTableRow(instanceId, rowId, orgId),
    onSuccess: async () => {
      setDeleteConfirmRowId(null);
      await invalidateRows();
    },
  });

  const populateRowFromBattleMutation = useMutation({
    mutationFn: ({ rowId, battleId }: { rowId: string; battleId: string }) =>
      populateManagementTableRowFromBattle(instanceId, rowId, battleId, orgId),
    onSuccess: () => setLinkPickerRowId(null),
    onSettled: () => invalidateRows(),
  });

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const allRows = useMemo(() => rowsQuery.data?.items ?? [], [rowsQuery.data?.items]);
  const flatRows = useMemo(() => flattenManagementTableRows(allRows, expandedRowIds), [allRows, expandedRowIds]);

  // Select all & indeterminate state
  const visibleRowIds = useMemo(() => flatRows.map((f) => f.row.id), [flatRows]);
  const allVisibleSelected = visibleRowIds.length > 0 && visibleRowIds.every((id) => selectedRowIds.has(id));
  const someVisibleSelected = visibleRowIds.some((id) => selectedRowIds.has(id));

  // Sync indeterminate state to checkbox DOM element
  if (selectAllRef.current) {
    selectAllRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }

  const toggleSelectAll = () => {
    onSelectAllInGroup?.(visibleRowIds, !allVisibleSelected);
  };

  const toggleRowExpanded = useCallback((rowId: string) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const onCellCommit = useCallback(
    (row: CompetitionManagementTableRowDto, columnId: string, next: unknown, immediate?: boolean) => {
      if (immediate === false) return;
      patchRowMutation.mutate({ rowId: row.id, cells: { [columnId]: next } });
    },
    [patchRowMutation],
  );

  const colorTheme = resolveGroupColor(groupColor);
  const colSpanAll = sortedColumns.length + 2;

  return (
    <div className="mt-8">
      {/* Monday.com Collapsible Group Header */}
      <CompetitionManagementTableGroupHeader
        title={groupTitle}
        count={allRows.length}
        collapsed={collapsed}
        colorKey={groupColor}
        onToggleCollapse={() => setCollapsed((c) => !c)}
        onAddRow={() => addRowMutation.mutate()}
        onDeleteGroup={onDeleteGroup}
        addRowPending={addRowMutation.isPending}
      />

      {/* Group Table Surface */}
      {!collapsed ? (
        <div className={`overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-sm ${colorTheme.border} border-t-2`}>
          <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <table className="min-w-full border-separate border-spacing-0 text-xs">
              <thead>
                <tr className="bg-surface-muted text-left font-semibold text-text-secondary">
                  {/* Select All Checkbox */}
                  <th className={`sticky left-0 z-[4] w-10 border-b border-r border-border-default bg-surface-muted px-2 py-2 shadow-md ${colorTheme.border} border-l-4`}>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      disabled={!enabled || visibleRowIds.length === 0}
                      className="size-3.5 rounded border-border-default text-primary-600 focus:ring-primary-500"
                      aria-label="Select all visible rows in group"
                    />
                  </th>
                  {sortedColumns.map((col) => (
                    <th key={col.id} className="min-w-[130px] border-b border-r border-border-default p-0 font-medium">
                      <ManagementTableColumnHeadCell
                        orgId={orgId}
                        definitionId={definitionId}
                        instanceId={instanceId}
                        column={col}
                        columnCount={sortedColumns.length}
                        enabled={enabled}
                      />
                    </th>
                  ))}
                  {/* Right Header: + Add Column trigger */}
                  <th className="sticky right-0 z-[4] min-w-[100px] border-b border-border-default bg-surface-muted px-1 py-1 font-medium shadow-md">
                    {onOpenAddColumn ? (
                      <button
                        type="button"
                        onClick={(e) => onOpenAddColumn(e.currentTarget)}
                        disabled={!enabled}
                        className="inline-flex h-7 w-full items-center gap-1.5 rounded-md px-1.5 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-surface-default"
                        title="Add column"
                      >
                        <span className="inline-flex size-4.5 items-center justify-center rounded border border-border-default bg-surface-default text-text-secondary">
                          <Plus className="size-3" aria-hidden />
                        </span>
                        <span className="truncate">Add column</span>
                      </button>
                    ) : (
                      <span className="sr-only">Actions</span>
                    )}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rowsQuery.isPending ? (
                  <tr>
                    <td colSpan={colSpanAll} className="py-8 text-center text-xs text-text-tertiary">
                      Loading competitions…
                    </td>
                  </tr>
                ) : allRows.length === 0 ? (
                  <tr>
                    <td colSpan={colSpanAll} className="py-6 text-center text-xs text-text-tertiary">
                      No competitions in this group yet. Click &quot;+ Add Competition&quot; below.
                    </td>
                  </tr>
                ) : (
                  flatRows.map((flat) => {
                    const { row, depth, hasChildren } = flat;
                    return (
                      <CompetitionManagementTableRow
                        key={row.id}
                        row={row}
                        columns={sortedColumns}
                        colorKey={groupColor}
                        isSelected={selectedRowIds.has(row.id)}
                        depth={depth}
                        hasChildren={hasChildren}
                        isExpanded={expandedRowIds.has(row.id)}
                        onToggleExpanded={() => toggleRowExpanded(row.id)}
                        onToggleSelect={() => onToggleSelectRow?.(row.id)}
                        onCellCommit={(colId, next, imm) => onCellCommit(row, colId, next, imm)}
                        onOpenLinkPicker={() => setLinkPickerRowId(row.id)}
                        onDeleteRow={() => setDeleteConfirmRowId(row.id)}
                        battles={myBattles}
                      />
                    );
                  })
                )}

                {/* Monday.com Group Summary Footer */}
                <CompetitionManagementTableGroupSummary columns={sortedColumns} rows={allRows} colorKey={groupColor} />
              </tbody>
            </table>

            {/* Bottom "+ Add Competition" Row */}
            <div className="flex items-center border-t border-border-default bg-surface-muted/30 px-2 py-1.5">
              <button
                type="button"
                disabled={addRowMutation.isPending || !enabled}
                onClick={() => addRowMutation.mutate()}
                className={`inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-semibold transition-colors hover:bg-surface-muted disabled:opacity-50 ${colorTheme.text}`}
              >
                <Plus className="size-3.5" aria-hidden />
                + Add Competition
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* Delete confirmation modal */}
      {deleteConfirmRowId && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface-default p-5 shadow-xl">
                <h3 className="text-base font-semibold text-text-primary">Delete competition?</h3>
                <p className="mt-1.5 text-xs text-text-secondary">
                  This will remove this item from your management table.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
                    onClick={() => setDeleteConfirmRowId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                    disabled={deleteRowMutation.isPending}
                    onClick={() => {
                      if (deleteConfirmRowId) deleteRowMutation.mutate(deleteConfirmRowId);
                    }}
                  >
                    {deleteRowMutation.isPending ? "Deleting…" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* Link battle picker modal */}
      {linkPickerRowId && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-default p-5 shadow-xl">
                <h3 className="text-base font-semibold text-text-primary">Link Hosted Competition</h3>
                <p className="mt-1 text-xs text-text-tertiary">
                  Select one of your hosted battles to sync its data into this row.
                </p>
                <div className="mt-3 max-h-60 space-y-1.5 overflow-y-auto">
                  {myBattles.length === 0 ? (
                    <p className="py-6 text-center text-xs text-text-tertiary">
                      You don&apos;t host any competitions yet.
                    </p>
                  ) : (
                    myBattles.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() =>
                          populateRowFromBattleMutation.mutate({ rowId: linkPickerRowId, battleId: b.id })
                        }
                        className="flex w-full items-center justify-between rounded-lg border border-border-default p-2 text-left text-xs transition-colors hover:bg-surface-muted"
                      >
                        <span className="font-semibold text-text-primary">{b.title}</span>
                        <span className="text-[10px] text-text-tertiary">{b.status} · {b.difficulty}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    className="rounded-lg border border-border-default px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-surface-muted"
                    onClick={() => setLinkPickerRowId(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

export default CompetitionManagementTableGroupSection;
