/**
 * CompetitionManagementBoardView
 *
 * Monday.com-style Kanban Board view.
 * Renders competition cards grouped into visual status columns with direct battle links.
 *
 * @example
 * ```tsx
 * <CompetitionManagementBoardView rows={allRows} columns={cols} onCommitCell={handleCommit} />
 * ```
 */

"use client";

import { useMemo } from "react";
import { ExternalLink, Trophy, Users } from "lucide-react";

import { useCompetitionHubData } from "@/modules/Competition/hooks/useCompetitionHubData";
import type { CompetitionManagementTableRowDto } from "./types";
import {
  DEFAULT_COMPETITION_STATUS_OPTIONS,
  STATUS_TONE_CLASSES,
} from "./columnTypeMeta";


// ===== TYPES =====

export interface CompetitionManagementBoardViewProps {
  readonly rows: readonly CompetitionManagementTableRowDto[];
  readonly columns: readonly { id: string; title: string; type: string }[];
  readonly onCommitCell: (rowId: string, columnId: string, next: unknown) => void;
  readonly searchQuery?: string;
  readonly statusFilter?: string;
}

// ===== COMPONENT =====

export function CompetitionManagementBoardView({
  rows,
  columns,
  onCommitCell,
  searchQuery = "",
  statusFilter = "all",
}: Readonly<CompetitionManagementBoardViewProps>) {
  const { myBattles } = useCompetitionHubData();

  const statusColumn = useMemo(() => columns.find((c) => c.type === "status"), [columns]);
  const titleColumn = useMemo(
    () => columns.find((c) => c.title.toLowerCase() === "title" || c.title.toLowerCase() === "name") ?? columns[0],
    [columns],
  );
  const prizeColumn = useMemo(() => columns.find((c) => c.title.toLowerCase().includes("prize")), [columns]);
  const playersColumn = useMemo(() => columns.find((c) => c.title.toLowerCase().includes("player")), [columns]);

  // Filter rows
  const filteredRows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const matchesAny = Object.values(r.cells).some((v) =>
          typeof v === "string" ? v.toLowerCase().includes(q) : false,
        );
        if (!matchesAny) return false;
      }
      if (statusFilter !== "all" && statusColumn) {
        const s = String(r.cells[statusColumn.id] ?? "").toLowerCase();
        if (!s.includes(statusFilter.toLowerCase())) return false;
      }
      return true;
    });
  }, [rows, searchQuery, statusFilter, statusColumn]);

  // Group by status
  const kanbanColumns = DEFAULT_COMPETITION_STATUS_OPTIONS;

  return (
    <div className="mt-4 flex gap-4 overflow-x-auto pb-6">
      {kanbanColumns.map((colOption) => {
        const toneStyle = STATUS_TONE_CLASSES[colOption.tone] ?? STATUS_TONE_CLASSES.default;

        const colRows = filteredRows.filter((r) => {
          if (!statusColumn) return colOption.id === "opt_draft";
          const val = String(r.cells[statusColumn.id] ?? "").toLowerCase();
          return (
            val === colOption.label.toLowerCase() ||
            (colOption.id === "opt_draft" && !val) ||
            val.includes(colOption.label.toLowerCase())
          );
        });

        return (
          <div
            key={colOption.id}
            className="flex w-72 shrink-0 flex-col rounded-xl border border-border-default bg-surface-muted/40 p-3"
          >
            {/* Column Header */}
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`inline-block size-2.5 rounded-full ${toneStyle.bg}`} aria-hidden />
                <h3 className="text-xs font-bold text-text-primary">{colOption.label}</h3>
              </div>
              <span className="rounded-full bg-surface-default px-2 py-0.5 text-[10px] font-bold text-text-secondary">
                {colRows.length}
              </span>
            </div>

            {/* Cards */}
            <div className="flex-1 space-y-2.5 overflow-y-auto">
              {colRows.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border-default p-4 text-center text-xs text-text-tertiary">
                  No items
                </div>
              ) : (
                colRows.map((r) => {
                  const title = titleColumn ? String(r.cells[titleColumn.id] ?? "Untitled") : "Untitled";
                  const prize = prizeColumn ? r.cells[prizeColumn.id] : null;
                  const players = playersColumn ? r.cells[playersColumn.id] : null;

                  // Find battle link if any
                  const battleMatch = myBattles.find((b) =>
                    Object.values(r.cells).some(
                      (v) => typeof v === "string" && v.includes(`/features/competitions/${b.id}`),
                    ),
                  );

                  return (
                    <div
                      key={r.id}
                      className="rounded-lg border border-border-default bg-surface-default p-3 shadow-xs transition-shadow hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-text-primary">{title}</h4>
                        {battleMatch ? (
                          <a
                            href={`/features/competitions/${battleMatch.id}`}
                            className="text-primary-600 hover:text-primary-700"
                            title="Open competition"
                          >
                            <ExternalLink className="size-3.5" aria-hidden />
                          </a>
                        ) : null}
                      </div>

                      {/* Economics & scale chips */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] text-text-secondary">
                        {prize ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-text-primary">
                            <Trophy className="size-3 text-warning-500" aria-hidden />
                            {String(prize)} ETB
                          </span>
                        ) : null}

                        {players ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-1.5 py-0.5 font-semibold text-text-primary">
                            <Users className="size-3 text-primary-600" aria-hidden />
                            {String(players)}
                          </span>
                        ) : null}
                      </div>

                      {/* Quick Move Status */}
                      {statusColumn ? (
                        <div className="mt-3 border-t border-border-default pt-2">
                          <select
                            value={colOption.label}
                            onChange={(e) => onCommitCell(r.id, statusColumn.id, e.target.value)}
                            className="h-6 w-full rounded border border-border-default bg-surface-default px-1 text-[10px] font-medium text-text-secondary outline-none"
                          >
                            {kanbanColumns.map((opt) => (
                              <option key={opt.id} value={opt.label}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default CompetitionManagementBoardView;
