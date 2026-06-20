"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, Plus, SlidersHorizontal, Wrench } from "lucide-react";
import { useCallback, useId, useMemo, useRef, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type {
  ManagementTableColumnDto,
  ManagementTableRowDto,
  ManagementTableRowListResponseDto,
  SchoolMemberSearchPicker,
} from "@/modules/School/api";
import { createManagementTableRow, fetchManagementTableRows, patchManagementTableRowCells } from "@/modules/School/api";
import { ManagementTableCellEditor } from "@/modules/School/managementTable/ManagementTableCellEditor";
import { resolvePersonPickerForColumn } from "@/modules/School/managementTable/managementTablePersonCell";
import { ManagementTableBoardViewsPopover } from "@/modules/School/managementTable/ManagementTableBoardViewsPopover";
import { ManagementTableColumnHeadCell } from "@/modules/School/managementTable/ManagementTableColumnHeadCell";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

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
}: ManagementTableGroupSectionProps) {
  const queryClient = useQueryClient();
  const regionId = useId();
  const boardViewsAnchorRef = useRef<HTMLButtonElement | null>(null);
  const [boardViewsOpen, setBoardViewsOpen] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const enabled = parentEnabled && Boolean(groupId);

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

  const sortedColumns = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);
  const rows = rowsQuery.data?.items ?? [];

  const rowSummary = useMemo(() => {
    if (rowsQuery.isPending) return "Loading…";
    if (rowsQuery.isError) return "Could not load rows";
    if (rows.length === 0) return "No rows";
    if (rows.length === 1) return "1 row";
    return `${rows.length} rows`;
  }, [rows.length, rowsQuery.isError, rowsQuery.isPending]);

  const onCellCommit = (row: ManagementTableRowDto, columnId: string, next: unknown, immediate?: boolean) => {
    if (immediate !== false) {
      patchRowMutation.mutate({ rowId: row.id, cells: { [columnId]: next } });
    }
  };

  return (
    <div className="mt-10 first:mt-8">
      <div
        className={[
          "flex min-h-[2.75rem] items-stretch overflow-hidden rounded-t-xl border",
          expanded
            ? "border-transparent border-b-0 bg-transparent shadow-none"
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
          <span className="w-1 shrink-0 self-stretch rounded-full bg-primary-500" aria-hidden />
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
            </div>
            <p className="mt-px text-[11px] leading-tight text-text-tertiary">{rowSummary}</p>
          </div>
        </button>
        <div
          className={[
            "flex shrink-0 flex-wrap items-center justify-end gap-1.5 border-l px-2 py-1.5 sm:px-2.5",
            expanded ? "border-l-transparent bg-transparent" : "border-border-default bg-[#cfd9e4]/90",
          ].join(" ")}
        >
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full border border-border-default bg-surface-default px-3 py-1.5 text-xs font-medium text-text-secondary shadow-sm transition-colors hover:bg-surface-muted sm:px-4 sm:py-2"
            title="Coming soon"
          >
            1th January ↔ 7th January
          </button>
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
      </div>

      {expanded ? (
        <div
          id={regionId}
          className="rounded-b-xl border border-t-0 border-border-default bg-surface-default shadow-sm"
        >
      <div className="flex min-h-[44px] items-center gap-6 border-b border-border-default bg-surface-default px-3 pb-px pt-3">
        <span className="border-b-2 border-primary-600 pb-2 text-sm font-semibold text-text-primary">Main Table</span>
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

      <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#e8edf3] text-left text-text-secondary">
              <th className="sticky left-0 z-[4] w-9 border-b border-r border-white bg-[#e8edf3] px-1.5 py-1.5 shadow-[2px_0_10px_rgba(2,24,43,0.08)]">
                <span className="sr-only">Select</span>
              </th>
              {sortedColumns.map((col) => (
                <th
                  key={col.id}
                  className="group/colhead relative min-w-[140px] border-b border-l border-white p-0 font-medium align-top"
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
              <th className="sticky right-0 z-[4] min-w-[158px] border-b border-l border-white bg-[#e8edf3] px-1.5 py-1.5 font-medium shadow-[-2px_0_10px_rgba(2,24,43,0.08)]">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-between gap-1.5 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-left text-xs font-medium text-text-secondary transition-colors hover:bg-white/60"
                  onClick={(e) => onOpenAddColumn(e.currentTarget)}
                  disabled={!enabled}
                >
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary">
                      <Plus className="size-3.5" aria-hidden />
                    </span>
                    Add column
                  </span>
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {rowsQuery.isPending ? (
              <tr>
                <td colSpan={sortedColumns.length + 2} className="px-3 py-6 text-center text-text-tertiary">
                  Loading rows…
                </td>
              </tr>
            ) : rowsQuery.isError ? (
              <tr>
                <td colSpan={sortedColumns.length + 2} className="px-3 py-6 text-center text-sm text-red-600">
                  {rowsQuery.error instanceof ApiError ? rowsQuery.error.message : "Could not load rows."}
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id} className="group/row last:[&>td]:border-b-0 hover:bg-surface-muted/40">
                  <td className="sticky left-0 z-[2] border-b border-r border-border-default bg-surface-default px-1.5 py-1.5 align-middle shadow-[2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/40">
                    <input type="checkbox" className="size-3.5 rounded border-border-default" disabled aria-label="Row select (coming soon)" />
                  </td>
                  {sortedColumns.map((col) => (
                    <td
                      key={col.id}
                      className="border-b border-l border-border-default bg-surface-default px-1.5 py-1.5 align-top group-hover/row:bg-surface-muted/40"
                    >
                      <ManagementTableCellEditor
                        column={col}
                        value={row.cells[col.id]}
                        orgId={orgId}
                        schoolId={schoolId}
                        personPicker={resolvePersonPickerForColumn(col, personPicker)}
                        classWorkspaceItemId={classWorkspaceItemId}
                        onCommit={(next, imm) => onCellCommit(row, col.id, next, imm)}
                      />
                    </td>
                  ))}
                  <td className="sticky right-0 z-[2] border-b border-l border-border-default bg-surface-default px-1.5 py-1.5 align-top shadow-[-2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/40" />
                </tr>
              ))
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
      ) : null}
    </div>
  );
}
