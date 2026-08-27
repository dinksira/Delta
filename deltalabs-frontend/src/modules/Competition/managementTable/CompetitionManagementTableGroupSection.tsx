/**
 * CompetitionManagementTableGroupSection
 *
 * Renders a single group/tab of the competition management table.
 * Simplified from the School module — core CRUD only, no ghost ops / person cells / schedules.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableGroupSection orgId="o" definitionId="d" instanceId="i" groupId="g" columns={[]} parentEnabled />
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createCompetitionManagementTableRow,
  deleteCompetitionManagementTableRow,
  fetchCompetitionManagementTableRows,
  patchCompetitionManagementTableRow,
} from "@/modules/Competition/managementTable/api";
import type { CompetitionManagementTableRowDto } from "@/modules/Competition/managementTable/types";
import { competitionQueryKeys } from "@/modules/Competition/managementTable/competitionQueryKeys";
import { ManagementTableCellEditor } from "@/modules/Competition/managementTable/ManagementTableCellEditor";
import { ManagementTableColumnHeadCell } from "@/modules/Competition/managementTable/ManagementTableColumnHeadCell";
import { flattenManagementTableRows } from "@/modules/Competition/managementTable/managementTableRowHierarchy";

// ===== TYPES =====

export type CompetitionManagementTableGroupSectionProps = Readonly<{
  orgId: string;
  definitionId: string;
  instanceId: string;
  groupId: string;
  columns: readonly { id: string; title: string; type: string; order: number; settings?: Record<string, unknown> }[];
  parentEnabled: boolean;
}>;

// ===== COMPONENT =====

export function CompetitionManagementTableGroupSection({
  orgId,
  definitionId,
  instanceId,
  groupId,
  columns,
  parentEnabled,
}: CompetitionManagementTableGroupSectionProps) {
  const queryClient = useQueryClient();
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(() => new Set());
  const [deleteConfirmRowId, setDeleteConfirmRowId] = useState<string | null>(null);

  const enabled = parentEnabled && Boolean(groupId);

  const rowsQuery = useQuery({
    queryKey: competitionQueryKeys.rows(orgId, instanceId, groupId),
    queryFn: () => fetchCompetitionManagementTableRows(instanceId, groupId, 1, 500, orgId),
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
      patchCompetitionManagementTableRow(instanceId, rowId, cells, orgId),
    onSuccess: (updated) => {
      queryClient.setQueryData(
        competitionQueryKeys.rows(orgId, instanceId, groupId),
        (prev: { items: CompetitionManagementTableRowDto[] } | undefined) => {
          if (!prev) return prev;
          return {
            ...prev,
            items: prev.items.map((r) => (r.id === updated.id ? updated : r)),
          };
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

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const allRows = rowsQuery.data?.items ?? [];

  const flatRows = useMemo(
    () => flattenManagementTableRows(allRows, expandedRowIds),
    [allRows, expandedRowIds],
  );

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

  const colSpanAll = sortedColumns.length + 2;

  const rowSummary = useMemo(() => {
    if (rowsQuery.isPending) return "Loading\u2026";
    if (rowsQuery.isError) return "Could not load rows";
    if (allRows.length === 0) return "No rows";
    if (allRows.length === 1) return "1 row";
    return `${allRows.length} rows`;
  }, [allRows.length, rowsQuery.isError, rowsQuery.isPending]);

  return (
    <div className="mt-6">
      <div className="rounded-xl border border-border-default bg-surface-default shadow-sm">
        <div className="flex items-center gap-2.5 border-b border-border-default px-3 py-2.5">
          <span className="text-sm font-semibold text-text-primary">{rowSummary}</span>
        </div>

        <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <table className="min-w-full border-separate border-spacing-0 text-sm">
            <thead>
              <tr className="bg-surface-muted text-left text-text-secondary">
                <th className="sticky left-0 z-[4] w-10 border-b border-r border-white bg-surface-muted px-1 py-1 shadow-md">
                  <span className="sr-only">Row</span>
                </th>
                {sortedColumns.map((col) => (
                  <th
                    key={col.id}
                    className="group/colhead relative min-w-[120px] border-b border-l border-white p-0 font-medium align-middle"
                  >
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
                <th className="sticky right-0 z-[4] w-10 border-b border-l border-white bg-surface-muted px-1 py-1 shadow-md">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rowsQuery.isPending ? (
                <tr>
                  <td colSpan={colSpanAll} className="px-3 py-6 text-center text-text-tertiary">
                    Loading rows\u2026
                  </td>
                </tr>
              ) : rowsQuery.isError ? (
                <tr>
                  <td colSpan={colSpanAll} className="px-3 py-6 text-center text-sm text-red-600">
                    {rowsQuery.error instanceof ApiError ? rowsQuery.error.message : "Could not load rows."}
                  </td>
                </tr>
              ) : allRows.length === 0 ? (
                <tr>
                  <td colSpan={colSpanAll} className="px-3 py-8 text-center text-sm text-text-tertiary">
                    No rows yet.
                  </td>
                </tr>
              ) : (
                flatRows.map((flat) => {
                  const { row, depth, hasChildren } = flat;
                  const isExpanded = expandedRowIds.has(row.id);
                  return (
                    <tr key={row.id} className="group/row hover:bg-surface-muted/30">
                      <td className="sticky left-0 z-[2] h-9 border-b border-r border-border-default bg-surface-default px-1 align-middle shadow-[2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/30">
                        <div className="flex items-center gap-0.5">
                          {hasChildren ? (
                            <button
                              type="button"
                              className="inline-flex size-5 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-black/[0.06]"
                              aria-expanded={isExpanded}
                              onClick={() => toggleRowExpanded(row.id)}
                            >
                              <svg
                                className={`size-3.5 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                                viewBox="0 0 16 16"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                              >
                                <path d="M4 6l4 4 4-4" />
                              </svg>
                            </button>
                          ) : (
                            <span className="inline-block size-5 shrink-0" aria-hidden />
                          )}
                          <span className="inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary-50 px-1.5 text-[10px] font-bold text-primary-700">
                            {depth > 0 ? `\u2022` : (flatRows.filter((f) => f.depth === 0).indexOf(flat) + 1)}
                          </span>
                        </div>
                      </td>
                      {sortedColumns.map((col) => (
                        <td
                          key={col.id}
                          className="h-9 border-b border-l border-border-default px-1 align-middle bg-surface-default group-hover/row:bg-surface-muted/30"
                          style={{ paddingLeft: depth > 0 ? 12 + depth * 14 : undefined }}
                        >
                          <div className="min-w-0 flex-1">
                            <ManagementTableCellEditor
                              column={col}
                              value={row.cells[col.id]}
                              onCommit={(next, imm) => onCellCommit(row, col.id, next, imm)}
                            />
                          </div>
                        </td>
                      ))}
                      <td className="sticky right-0 z-[2] h-9 border-b border-l border-border-default bg-surface-default px-1 align-middle shadow-[-2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/30">
                        <button
                          type="button"
                          className="inline-flex size-7 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Delete row"
                          disabled={!enabled || deleteRowMutation.isPending}
                          onClick={() => setDeleteConfirmRowId(row.id)}
                        >
                          <Trash2 className="size-3.5" aria-hidden />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

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
        </div>
      </div>

      {deleteConfirmRowId && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40">
              <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface-default p-6 shadow-xl">
                <h3 className="text-base font-semibold text-text-primary">Delete row?</h3>
                <p className="mt-2 text-sm text-text-secondary">
                  This permanently deletes the selected row and its subitems.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                    disabled={deleteRowMutation.isPending}
                    onClick={() => setDeleteConfirmRowId(null)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={deleteRowMutation.isPending}
                    onClick={() => {
                      if (deleteConfirmRowId) deleteRowMutation.mutate(deleteConfirmRowId);
                    }}
                  >
                    {deleteRowMutation.isPending ? "Deleting\u2026" : "Delete"}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {deleteRowMutation.isError ? (
        <p className="fixed bottom-[7.5rem] left-1/2 z-[190] -translate-x-1/2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 shadow">
          {deleteRowMutation.error instanceof ApiError
            ? deleteRowMutation.error.message
            : "Could not delete row."}
        </p>
      ) : null}
    </div>
  );
}
