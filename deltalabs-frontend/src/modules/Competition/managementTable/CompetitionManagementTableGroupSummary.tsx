/**
 * CompetitionManagementTableGroupSummary
 *
 * Monday.com-style aggregation summary row at the bottom of a table group.
 * Displays item totals, status distribution mini-bars, and numeric sums.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableGroupSummary columns={columns} rows={rows} />
 * ```
 */

"use client";

import { useMemo } from "react";
import type { CompetitionManagementTableRowDto } from "./types";
import { STATUS_TONE_CLASSES } from "./columnTypeMeta";

// ===== TYPES =====

export interface CompetitionManagementTableGroupSummaryProps {
  readonly columns: readonly { id: string; title: string; type: string }[];
  readonly rows: readonly CompetitionManagementTableRowDto[];
  readonly colorKey?: string;
}

// ===== HELPERS =====

function computeStatusDistribution(
  rows: readonly CompetitionManagementTableRowDto[],
  statusColumnId: string,
): { donePct: number; livePct: number; workingPct: number; otherPct: number } {
  if (rows.length === 0) return { donePct: 0, livePct: 0, workingPct: 0, otherPct: 0 };
  let done = 0;
  let live = 0;
  let working = 0;
  let other = 0;

  for (const r of rows) {
    const val = String(r.cells[statusColumnId] ?? "").toLowerCase();
    if (val.includes("done") || val.includes("complete")) done++;
    else if (val.includes("live")) live++;
    else if (val.includes("work") || val.includes("progress")) working++;
    else other++;
  }

  const total = rows.length;
  return {
    donePct: Math.round((done / total) * 100),
    livePct: Math.round((live / total) * 100),
    workingPct: Math.round((working / total) * 100),
    otherPct: Math.round((other / total) * 100),
  };
}

function computeNumericSum(
  rows: readonly CompetitionManagementTableRowDto[],
  columnId: string,
): number | null {
  let sum = 0;
  let hasValid = false;
  for (const r of rows) {
    const val = r.cells[columnId];
    if (typeof val === "number" && !Number.isNaN(val)) {
      sum += val;
      hasValid = true;
    } else if (typeof val === "string") {
      const parsed = parseFloat(val.replace(/[^0-9.-]+/g, ""));
      if (!Number.isNaN(parsed)) {
        sum += parsed;
        hasValid = true;
      }
    }
  }
  return hasValid ? sum : null;
}

// ===== COMPONENT =====

export function CompetitionManagementTableGroupSummary({
  columns,
  rows,
}: Readonly<CompetitionManagementTableGroupSummaryProps>) {
  const statusColumn = useMemo(() => columns.find((c) => c.type === "status"), [columns]);
  const statusDist = useMemo(
    () => (statusColumn ? computeStatusDistribution(rows, statusColumn.id) : null),
    [rows, statusColumn],
  );

  if (rows.length === 0) return null;

  return (
    <tr className="border-t-2 border-border-default bg-surface-muted/50 text-xs font-semibold text-text-secondary">
      {/* Sticky selection + count column */}
      <td className="sticky left-0 z-[3] border-r border-border-default bg-surface-muted/90 px-2 py-1.5 shadow-[2px_0_10px_rgba(2,24,43,0.06)]">
        <span className="truncate tabular-nums">{rows.length} {rows.length === 1 ? "item" : "items"}</span>
      </td>

      {/* Column summaries */}
      {columns.map((col) => {
        const lowerTitle = col.title.toLowerCase();

        // Status column -> mini horizontal distribution bar
        if (col.type === "status" && statusDist) {
          return (
            <td key={col.id} className="border-r border-border-default px-2 py-1.5">
              <div
                className="flex h-3.5 w-full overflow-hidden rounded shadow-xs"
                title={`Done: ${statusDist.donePct}%, Live: ${statusDist.livePct}%, Working: ${statusDist.workingPct}%`}
              >
                {statusDist.donePct > 0 ? (
                  <div
                    className={`${STATUS_TONE_CLASSES.success.bg} transition-all`}
                    style={{ width: `${statusDist.donePct}%` }}
                  />
                ) : null}
                {statusDist.livePct > 0 ? (
                  <div
                    className={`${STATUS_TONE_CLASSES.live.bg} transition-all`}
                    style={{ width: `${statusDist.livePct}%` }}
                  />
                ) : null}
                {statusDist.workingPct > 0 ? (
                  <div
                    className={`${STATUS_TONE_CLASSES.warning.bg} transition-all`}
                    style={{ width: `${statusDist.workingPct}%` }}
                  />
                ) : null}
                {statusDist.otherPct > 0 ? (
                  <div
                    className={`${STATUS_TONE_CLASSES.default.bg} transition-all`}
                    style={{ width: `${statusDist.otherPct}%` }}
                  />
                ) : null}
              </div>
            </td>
          );
        }

        // Numeric or prize pool sums
        if (
          col.type === "number" ||
          lowerTitle.includes("prize") ||
          lowerTitle.includes("player") ||
          lowerTitle.includes("fee")
        ) {
          const sum = computeNumericSum(rows, col.id);
          return (
            <td key={col.id} className="border-r border-border-default px-2 py-1.5 text-right font-bold tabular-nums">
              {sum !== null ? (
                <span className="text-text-primary">
                  {lowerTitle.includes("prize") || lowerTitle.includes("fee")
                    ? `${sum.toLocaleString()} ETB`
                    : sum.toLocaleString()}
                </span>
              ) : (
                <span className="text-text-tertiary">—</span>
              )}
            </td>
          );
        }

        return (
          <td key={col.id} className="border-r border-border-default px-2 py-1.5 text-center text-text-tertiary">
            —
          </td>
        );
      })}

      {/* Sticky action column blank */}
      <td className="sticky right-0 z-[3] bg-surface-muted/90 px-1 py-1.5" />
    </tr>
  );
}

export default CompetitionManagementTableGroupSummary;
