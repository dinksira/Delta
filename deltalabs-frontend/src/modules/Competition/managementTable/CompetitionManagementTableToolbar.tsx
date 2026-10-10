/**
 * CompetitionManagementTableToolbar
 *
 * Monday.com-style top control bar for the competition management table.
 * Includes view tabs (Table vs Kanban), search filter, status filter,
 * "Sync Hosted Battles" CTA, and Add Column / Group actions.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableToolbar viewMode="table" onViewModeChange={setMode} search="" onSearchChange={setSearch} />
 * ```
 */

"use client";

import { Kanban, Plus, RefreshCw, Search, Table2 } from "lucide-react";
import { Button } from "@/components/theme";
import type { CompetitionBoardViewMode } from "./types";

// ===== TYPES =====

export interface CompetitionManagementTableToolbarProps {
  readonly viewMode: CompetitionBoardViewMode;
  readonly onViewModeChange: (mode: CompetitionBoardViewMode) => void;
  readonly search: string;
  readonly onSearchChange: (query: string) => void;
  readonly statusFilter: string;
  readonly onStatusFilterChange: (status: string) => void;
  readonly onSyncHostedBattles: () => void;
  readonly syncPending?: boolean;
  readonly unimportedBattleCount?: number;
  readonly onAddColumn: (target: HTMLButtonElement) => void;
  readonly onNewGroup: () => void;
  readonly addColumnDisabled?: boolean;
}


// ===== COMPONENT =====

export function CompetitionManagementTableToolbar({
  viewMode,
  onViewModeChange,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSyncHostedBattles,
  syncPending,
  unimportedBattleCount = 0,
  onAddColumn,
  onNewGroup,
  addColumnDisabled,
}: Readonly<CompetitionManagementTableToolbarProps>) {
  return (
    <div className="mb-4 space-y-3">
      {/* Top View Selector & Primary Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: View Tabs (Table vs Kanban) */}
        <div className="flex items-center gap-1 rounded-xl border border-border-default bg-surface-muted/60 p-1">
          <button
            type="button"
            onClick={() => onViewModeChange("table")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === "table"
                ? "bg-surface-default text-primary-600 shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Table2 className="size-3.5" aria-hidden />
            <span>Main Table</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange("kanban")}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              viewMode === "kanban"
                ? "bg-surface-default text-primary-600 shadow-xs"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <Kanban className="size-3.5" aria-hidden />
            <span>Kanban Board</span>

          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* 1-Click Sync Hosted Battles */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={syncPending}
            onClick={onSyncHostedBattles}
            className="relative gap-1.5 text-xs"
            title="Import or sync hosted battles created by you"
          >
            <RefreshCw className={`size-3.5 ${syncPending ? "animate-spin" : ""}`} aria-hidden />
            <span>Sync My Battles</span>
            {unimportedBattleCount > 0 ? (
              <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                {unimportedBattleCount}
              </span>
            ) : null}
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={addColumnDisabled}
            onClick={(e) => onAddColumn(e.currentTarget)}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" aria-hidden />
            Add column
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={onNewGroup}
            className="gap-1.5 text-xs"
          >
            <Plus className="size-3.5" aria-hidden />
            New Group
          </Button>
        </div>
      </div>

      {/* Bottom Filter & Search Bar */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-text-tertiary" aria-hidden />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search competitions…"
            className="h-8 w-full rounded-lg border border-border-default bg-surface-default pl-8 pr-3 text-xs text-text-primary outline-none focus:border-primary-500"
          />
        </div>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="h-8 rounded-lg border border-border-default bg-surface-default px-2.5 text-xs font-medium text-text-secondary outline-none focus:border-primary-500"
        >
          <option value="all">All Statuses</option>
          <option value="live">Live Only</option>
          <option value="upcoming">Upcoming</option>
          <option value="draft">Drafts</option>
          <option value="done">Completed</option>
        </select>
      </div>
    </div>
  );
}

export default CompetitionManagementTableToolbar;
