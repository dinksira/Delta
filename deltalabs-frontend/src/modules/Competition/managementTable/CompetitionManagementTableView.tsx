/**
 * CompetitionManagementTableView
 *
 * Top-level Monday.com-style orchestrator for the competition management table.
 * Designed consistently with the School module:
 * - Instance bundle and schema management
 * - View mode switcher (Main Table vs Kanban Board)
 * - Search & status filters
 * - 1-Click "Sync My Battles" auto-population
 * - Sibling row reordering (Move Up / Move Down)
 * - Multi-select floating action dock
 * - Add column popover triggered from toolbar or header
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableView />
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Table2 } from "lucide-react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import { useCompetitionHubData } from "@/modules/Competition/hooks/useCompetitionHubData";
import {
  appendCompetitionManagementTableColumn,
  bootstrapCompetitionManagementTable,
  bootstrapTopicBattleManagementTable,
  createCompetitionManagementTableGroup,
  createCompetitionManagementTableRow,
  deleteCompetitionManagementTableRow,
  fetchCompetitionManagementTableRows,
  getCompetitionManagementTableInstance,
  moveCompetitionManagementTableRow,
  populateManagementTableRowFromBattle,
} from "./api";
import { competitionQueryKeys } from "./competitionQueryKeys";
import { ManagementTableAddColumnPopover } from "./ManagementTableAddColumnPopover";
import {
  COMPETITION_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  GROUP_COLOR_KEYS,
  type ManagementTableAddColumnOption,
} from "./columnTypeMeta";
import { CompetitionManagementTableGroupSection } from "./CompetitionManagementTableGroupSection";
import { CompetitionManagementTableSelectionBar } from "./CompetitionManagementTableSelectionBar";
import { CompetitionManagementTableToolbar } from "./CompetitionManagementTableToolbar";
import { CompetitionManagementBoardView } from "./CompetitionManagementBoardView";
import type { CompetitionBoardViewMode } from "./types";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";

// ===== CONSTANTS =====

const ORG_ID = "delta-labs";

// ===== TYPES =====

export interface CompetitionManagementTableViewProps {
  readonly battleId?: string;
}

// ===== HELPER MODAL =====

function NewGroupDialog({
  open,
  onClose,
  onSubmit,
  pending,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string) => void;
  pending: boolean;
}>) {
  const [title, setTitle] = useState("");
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/40 p-4">
      <div
        className="w-full max-w-md rounded-xl border border-border-default bg-surface-default p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base font-semibold text-text-primary">New Table Group</h3>
        <p className="mt-1 text-xs text-text-tertiary">
          Adds another section to your competition management board.
        </p>
        <form
          className="mt-4"
          onSubmit={(e) => {
            e.preventDefault();
            const t = title.trim();
            if (!t || pending) return;
            onSubmit(t);
          }}
        >
          <label className="block text-xs font-medium text-text-secondary">
            Group name
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border-default bg-surface-default px-3 py-2 text-xs text-text-primary outline-none focus:border-primary-500"
              placeholder="e.g. Completed Tournaments"
              autoFocus
            />
          </label>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" disabled={pending || !title.trim()}>
              Create group
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== COMPONENT =====

export function CompetitionManagementTableView({
  battleId,
}: Readonly<CompetitionManagementTableViewProps>) {
  const queryClient = useQueryClient();
  const addColumn = useManagementTableAddColumnPopover();
  const { myBattles } = useCompetitionHubData();

  // Board View State
  const [viewMode, setViewMode] = useState<CompetitionBoardViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRowIds, setSelectedRowIds] = useState<Set<string>>(() => new Set());
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);

  const bootstrapQuery = useQuery({
    queryKey: battleId
      ? [...competitionQueryKeys.all, "battle", battleId]
      : competitionQueryKeys.all,
    queryFn: () =>
      battleId
        ? bootstrapTopicBattleManagementTable(battleId, ORG_ID)
        : bootstrapCompetitionManagementTable(ORG_ID),
    staleTime: 0,
    refetchOnMount: "always",
    retry: 1,
  });

  const instanceId = bootstrapQuery.data?.instance.id ?? "";
  const definitionId = bootstrapQuery.data?.definition.id ?? "";

  const bundleQuery = useQuery({
    queryKey: competitionQueryKeys.instanceBundle(ORG_ID, instanceId),
    queryFn: () => getCompetitionManagementTableInstance(instanceId, ORG_ID),
    enabled: Boolean(instanceId),
  });

  const tableGroups = useMemo(() => {
    const raw = bundleQuery.data?.instance.tableGroups;
    if (raw && raw.length > 0) return [...raw].sort((a, b) => a.order - b.order);
    return [{ id: "mtg_main", title: "Active Competitions", order: 0 }];
  }, [bundleQuery.data?.instance.tableGroups]);

  const mainGroupId = tableGroups[0]?.id ?? "mtg_main";

  // Rows for main group to inspect for Kanban and Auto-Sync
  const mainRowsQuery = useQuery({
    queryKey: competitionQueryKeys.rows(ORG_ID, instanceId, mainGroupId),
    queryFn: () => fetchCompetitionManagementTableRows(instanceId, mainGroupId, 1, 200, ORG_ID),
    enabled: Boolean(instanceId && mainGroupId),
  });

  const allMainRows = useMemo(() => mainRowsQuery.data?.items ?? [], [mainRowsQuery.data?.items]);

  // Determine un-imported battles count
  const unimportedBattles = useMemo(() => {
    if (!myBattles || myBattles.length === 0) return [];
    return myBattles.filter((b) => {
      const match = allMainRows.some((r) =>
        Object.values(r.cells).some((v) => typeof v === "string" && v.includes(`/features/competitions/${b.id}`)),
      );
      return !match;
    });
  }, [myBattles, allMainRows]);

  const invalidateBundleAndRows = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.instanceBundle(ORG_ID, instanceId),
    });
    for (const g of tableGroups) {
      await queryClient.invalidateQueries({
        queryKey: competitionQueryKeys.rows(ORG_ID, instanceId, g.id),
      });
    }
  }, [queryClient, instanceId, tableGroups]);

  // 1-Click Sync My Hosted Competitions
  const syncHostedBattlesMutation = useMutation({
    mutationFn: async () => {
      if (!instanceId || unimportedBattles.length === 0) return;
      for (const battle of unimportedBattles) {
        const createdRow = await createCompetitionManagementTableRow(instanceId, mainGroupId, ORG_ID);
        await populateManagementTableRowFromBattle(instanceId, createdRow.id, battle.id, ORG_ID);
      }
    },
    onSuccess: invalidateBundleAndRows,
  });

  // Reordering
  const moveRowMutation = useMutation({
    mutationFn: ({ rowId, direction }: { rowId: string; direction: "up" | "down" }) =>
      moveCompetitionManagementTableRow(instanceId, rowId, { direction }, ORG_ID),
    onSuccess: invalidateBundleAndRows,
  });

  const singleSelectedId = selectedRowIds.size === 1 ? Array.from(selectedRowIds)[0] : null;
  const reorderState = useMemo(() => {
    if (!singleSelectedId) return { canMoveUp: false, canMoveDown: false };
    const row = allMainRows.find((r) => r.id === singleSelectedId);
    if (!row) return { canMoveUp: false, canMoveDown: false };
    const parentKey = row.parentRowId ?? null;
    const siblings = allMainRows.filter((r) => (r.parentRowId ?? null) === parentKey);
    const index = siblings.findIndex((r) => r.id === row.id);
    return {
      canMoveUp: index > 0,
      canMoveDown: index >= 0 && index < siblings.length - 1,
    };
  }, [allMainRows, singleSelectedId]);

  // Batch delete selected rows
  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      for (const rowId of selectedRowIds) {
        await deleteCompetitionManagementTableRow(instanceId, rowId, ORG_ID);
      }
    },
    onSuccess: async () => {
      setSelectedRowIds(new Set());
      await invalidateBundleAndRows();
    },
  });

  const appendColumnMutation = useMutation({
    mutationFn: (opt: ManagementTableAddColumnOption) =>
      appendCompetitionManagementTableColumn(definitionId, {
        title: opt.columnTitle ?? defaultTitleForColumnType(opt.supportedType!),
        type: opt.supportedType!,
        settings: defaultSettingsForColumnType(opt.supportedType!),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const createTableGroupMutation = useMutation({
    mutationFn: (title: string) => createCompetitionManagementTableGroup(instanceId, title, ORG_ID),
    onSuccess: async () => {
      setNewGroupDialogOpen(false);
      await invalidateBundleAndRows();
    },
  });

  const toggleSelectRow = useCallback((rowId: string) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const selectAllInGroup = useCallback((rowIds: string[], select: boolean) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      for (const id of rowIds) {
        if (select) next.add(id);
        else next.delete(id);
      }
      return next;
    });
  }, []);

  const addColumnOptions = useMemo(
    () => filterAddColumnGroups(COMPETITION_ADD_COLUMN_GROUPS, addColumn.search),
    [addColumn.search],
  );

  const onPickAddColumnOption = (opt: ManagementTableAddColumnOption) => {
    if (!opt.supportedType) return;
    appendColumnMutation.mutate(opt, {
      onSettled: () => addColumn.close(),
    });
  };

  if (bootstrapQuery.isError) {
    const msg =
      bootstrapQuery.error instanceof ApiError ? bootstrapQuery.error.message : "Could not load competition table.";
    return <p className="text-sm text-red-600">{msg}</p>;
  }

  if (bootstrapQuery.isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-2.5 py-16">
        <div className="size-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" aria-hidden />
        <p className="text-xs font-medium text-text-secondary">Loading competitions…</p>
      </div>
    );
  }


  const columns = bundleQuery.data?.definition.columns ?? [];

  return (
    <div className="mx-auto max-w-[100rem] pb-28">
      {/* Table Title Header */}
      <header className="mb-5 flex items-center justify-between gap-3 border-b border-border-default pb-4">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-default text-primary-600 shadow-xs"
            aria-hidden
          >
            <Table2 className="size-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              {bundleQuery.data?.instance.title ?? "My Competitions Management"}
            </h1>
            <p className="text-xs text-text-tertiary">
              Manage, organize, and monitor all your hosted competitions and topic battles.
            </p>
          </div>
        </div>
      </header>

      {/* Monday.com Board Toolbar */}
      <CompetitionManagementTableToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSyncHostedBattles={() => syncHostedBattlesMutation.mutate()}
        syncPending={syncHostedBattlesMutation.isPending}
        unimportedBattleCount={unimportedBattles.length}
        onAddColumn={(btn) => addColumn.openFromButton(btn)}
        onNewGroup={() => setNewGroupDialogOpen(true)}
        addColumnDisabled={appendColumnMutation.isPending || !bundleQuery.data}
      />

      {/* Content: Main Table Grid vs Kanban Board */}
      {viewMode === "table" ? (
        tableGroups.map((g, idx) => {
          const colorKey = GROUP_COLOR_KEYS[idx % GROUP_COLOR_KEYS.length];
          return (
            <CompetitionManagementTableGroupSection
              key={g.id}
              orgId={ORG_ID}
              definitionId={definitionId}
              instanceId={instanceId}
              groupId={g.id}
              groupTitle={g.title}
              groupColor={colorKey}
              columns={columns}
              parentEnabled={Boolean(bundleQuery.data)}
              battleId={battleId}
              selectedRowIds={selectedRowIds}
              onToggleSelectRow={toggleSelectRow}
              onSelectAllInGroup={selectAllInGroup}
              onOpenAddColumn={(btn) => addColumn.openFromButton(btn)}
            />
          );
        })
      ) : (
        <CompetitionManagementBoardView
          rows={allMainRows}
          columns={columns}
          searchQuery={search}
          statusFilter={statusFilter}
          onCommitCell={() => invalidateBundleAndRows()}
        />
      )}

      {/* Monday.com Floating Batch Selection Toolbar */}
      <CompetitionManagementTableSelectionBar
        selectedCount={selectedRowIds.size}
        canMoveUp={reorderState.canMoveUp}
        canMoveDown={reorderState.canMoveDown}
        onMoveUp={() => singleSelectedId && moveRowMutation.mutate({ rowId: singleSelectedId, direction: "up" })}
        onMoveDown={() => singleSelectedId && moveRowMutation.mutate({ rowId: singleSelectedId, direction: "down" })}
        onDelete={() => batchDeleteMutation.mutate()}
        onClear={() => setSelectedRowIds(new Set())}
        busy={batchDeleteMutation.isPending || moveRowMutation.isPending}
      />

      {/* New Group Dialog */}
      <NewGroupDialog
        open={newGroupDialogOpen}
        onClose={() => setNewGroupDialogOpen(false)}
        onSubmit={(t) => createTableGroupMutation.mutate(t)}
        pending={createTableGroupMutation.isPending}
      />

      {/* Add Column Popover */}
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

export default CompetitionManagementTableView;
