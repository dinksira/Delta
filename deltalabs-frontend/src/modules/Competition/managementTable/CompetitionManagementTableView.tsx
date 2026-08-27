/**
 * CompetitionManagementTableView
 *
 * Top-level orchestrator for the competition management table.
 * Bootstraps (or loads) the table, fetches the instance bundle,
 * and renders group sections with columns and rows.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableView />
 * ```
 */

"use client";

import { useCallback, useMemo, useState } from "react";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Table2 } from "lucide-react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  appendCompetitionManagementTableColumn,
  bootstrapCompetitionManagementTable,
  createCompetitionManagementTableGroup,
  getCompetitionManagementTableInstance,
} from "@/modules/Competition/managementTable/api";
import { competitionQueryKeys } from "@/modules/Competition/managementTable/competitionQueryKeys";
import { ManagementTableAddColumnPopover } from "@/modules/Competition/managementTable/ManagementTableAddColumnPopover";
import {
  MANAGEMENT_TABLE_ADD_COLUMN_GROUPS,
  defaultSettingsForColumnType,
  defaultTitleForColumnType,
  filterAddColumnGroups,
  type ManagementTableAddColumnOption,
} from "@/modules/Competition/managementTable/columnTypeMeta";
import { CompetitionManagementTableGroupSection } from "@/modules/Competition/managementTable/CompetitionManagementTableGroupSection";
import { useManagementTableAddColumnPopover } from "@/modules/School/managementTable/useManagementTableAddColumnPopover";

// ===== CONSTANTS =====

const ORG_ID = "delta-labs";

// ===== COMPONENT =====

export function CompetitionManagementTableView() {
  const queryClient = useQueryClient();
  const addColumn = useManagementTableAddColumnPopover();
  const [newGroupDialogOpen, setNewGroupDialogOpen] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");

  const bootstrapQuery = useQuery({
    queryKey: competitionQueryKeys.all,
    queryFn: () => bootstrapCompetitionManagementTable(ORG_ID),
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
    return [{ id: "mtg_main", title: "Main Table", order: 0 }];
  }, [bundleQuery.data?.instance.tableGroups]);

  const invalidateBundleAndRows = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.instanceBundle(ORG_ID, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.rows(ORG_ID, instanceId, "mtg_main"),
    });
  }, [queryClient, instanceId]);

  const appendColumnMutation = useMutation({
    mutationFn: (type: string) =>
      appendCompetitionManagementTableColumn(definitionId, {
        title: defaultTitleForColumnType(type as never),
        type,
        settings: defaultSettingsForColumnType(type as never),
      }),
    onSuccess: invalidateBundleAndRows,
  });

  const createTableGroupMutation = useMutation({
    mutationFn: (title: string) =>
      createCompetitionManagementTableGroup(instanceId, title, ORG_ID),
    onSuccess: async () => {
      setNewGroupDialogOpen(false);
      setNewGroupTitle("");
      await invalidateBundleAndRows();
    },
  });

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

  if (bootstrapQuery.isError) {
    const msg =
      bootstrapQuery.error instanceof ApiError
        ? bootstrapQuery.error.message
        : "Could not load competition table.";
    return <p className="text-sm text-red-600">{msg}</p>;
  }

  if (bootstrapQuery.isPending) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-text-secondary">Loading competition table…</p>
      </div>
    );
  }

  const columns = bundleQuery.data?.definition.columns ?? [];

  return (
    <div className="mx-auto max-w-[100rem] pb-24">
      <header className="mb-6">
        <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <span
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
              aria-hidden
              title="Competition management table"
            >
              <Table2 className="size-4" aria-hidden />
            </span>
            <div className="min-w-0 flex-1 pr-1">
              <h1 className="text-lg font-semibold text-text-primary sm:text-xl">
                {bundleQuery.data?.instance.title ?? "My Competitions"}
              </h1>
            </div>
          </div>
          <div className="shrink-0">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-2"
              disabled={appendColumnMutation.isPending || !bundleQuery.data}
              onClick={(e) => addColumn.openFromButton(e.currentTarget)}
            >
              <Plus className="size-4" aria-hidden />
              Add column
            </Button>
          </div>
        </div>
      </header>

      {tableGroups.map((g) => (
        <CompetitionManagementTableGroupSection
          key={g.id}
          orgId={ORG_ID}
          definitionId={definitionId}
          instanceId={instanceId}
          groupId={g.id}
          columns={columns}
          parentEnabled={Boolean(bundleQuery.data)}
        />
      ))}

      <div className="mt-6">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="gap-2"
          disabled={createTableGroupMutation.isPending || !bundleQuery.data}
          onClick={() => {
            createTableGroupMutation.reset();
            setNewGroupTitle("");
            setNewGroupDialogOpen(true);
          }}
        >
          <Table2 className="size-4" aria-hidden />
          New table group
        </Button>
      </div>

      {newGroupDialogOpen ? (
        <div className="fixed inset-0 z-[3500] flex items-center justify-center bg-black/40 p-4">
          <div
            className="w-full max-w-md rounded-xl border border-border-default bg-surface-default px-5 py-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
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
                  placeholder="e.g. Active battles"
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
          </div>
        </div>
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
