/**
 * CompetitionManagementTableRow
 *
 * Monday.com-style interactive table row.
 * Includes group-color left spine, checkbox selection, cell editors,
 * and direct links to hosted battles.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableRow row={row} columns={cols} isSelected={false} onToggleSelect={() => {}} onCommit={commit} />
 * ```
 */

"use client";

import { useMemo } from "react";
import { ExternalLink, Link2, Trash2 } from "lucide-react";

import type { CompetitionManagementTableRowDto } from "./types";
import { ManagementTableCellEditor } from "./ManagementTableCellEditor";
import { resolveGroupColor } from "./columnTypeMeta";

// ===== TYPES =====

export interface CompetitionManagementTableRowProps {
  readonly row: CompetitionManagementTableRowDto;
  readonly columns: readonly { id: string; title: string; type: string; settings?: Record<string, unknown> }[];
  readonly colorKey?: string;
  readonly isSelected: boolean;
  readonly depth: number;
  readonly hasChildren: boolean;
  readonly isExpanded: boolean;
  readonly onToggleExpanded: () => void;
  readonly onToggleSelect: () => void;
  readonly onCellCommit: (columnId: string, next: unknown, immediate?: boolean) => void;
  readonly onOpenLinkPicker: () => void;
  readonly onDeleteRow: () => void;
  readonly battles: readonly { id: string; title: string; status?: string }[];
}

// ===== COMPONENT =====

export function CompetitionManagementTableRow({
  row,
  columns,
  colorKey,
  isSelected,
  depth,
  hasChildren,
  isExpanded,
  onToggleExpanded,
  onToggleSelect,
  onCellCommit,
  onOpenLinkPicker,
  onDeleteRow,
  battles,
}: Readonly<CompetitionManagementTableRowProps>) {
  const colorTheme = resolveGroupColor(colorKey);

  // Check if row is linked to one of the creator's hosted battles
  const linkedBattle = useMemo(() => {
    for (const val of Object.values(row.cells)) {
      if (typeof val === "string" && val.includes("/features/competitions/")) {
        const battleId = val.split("/").pop();
        const found = battles.find((b) => b.id === battleId);
        if (found) return found;
      }
    }
    return null;
  }, [row.cells, battles]);

  return (
    <tr
      className={`group/row border-b border-border-default transition-colors hover:bg-surface-muted/40 ${
        isSelected ? "bg-primary-50/60" : "bg-surface-default"
      }`}
    >
      {/* Sticky left index + checkbox column with Monday color spine */}
      <td
        className={`sticky left-0 z-[2] h-9 border-r border-border-default bg-surface-default px-1 align-middle shadow-[2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/40 ${colorTheme.border} border-l-4`}
      >
        <div className="flex items-center gap-1.5">
          {/* Multi-select checkbox */}
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="size-3.5 rounded border-border-default text-primary-600 focus:ring-primary-500"
            aria-label="Select row"
          />

          {/* Subitem collapse toggle */}
          {hasChildren ? (
            <button
              type="button"
              className="inline-flex size-4 shrink-0 items-center justify-center rounded text-text-secondary hover:bg-black/[0.06]"
              aria-expanded={isExpanded}
              onClick={onToggleExpanded}
            >
              <svg
                className={`size-3 transition-transform ${isExpanded ? "" : "-rotate-90"}`}
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 6l4 4 4-4" />
              </svg>
            </button>
          ) : (
            <span className="size-4 shrink-0" aria-hidden />
          )}
        </div>
      </td>

      {/* Cells */}
      {columns.map((col, idx) => {
        const isPrimaryColumn = idx === 0 || col.title.toLowerCase() === "title" || col.title.toLowerCase() === "name";

        return (
          <td
            key={col.id}
            className="h-9 border-r border-border-default px-1 align-middle"
            style={{ paddingLeft: depth > 0 && idx === 0 ? 12 + depth * 14 : undefined }}
          >
            <div className="flex items-center gap-1">
              <div className="min-w-0 flex-1">
                <ManagementTableCellEditor
                  column={col}
                  value={row.cells[col.id]}
                  onCommit={(next, imm) => onCellCommit(col.id, next, imm)}
                />
              </div>

              {/* In primary title column: show hosted battle indicator & link if matched */}
              {isPrimaryColumn && linkedBattle ? (
                <a
                  href={`/features/competitions/${linkedBattle.id}`}
                  className="inline-flex size-5 shrink-0 items-center justify-center rounded text-primary-600 transition-colors hover:bg-primary-100"
                  title={`Open hosted competition: ${linkedBattle.title}`}
                >
                  <ExternalLink className="size-3" aria-hidden />
                </a>
              ) : null}
            </div>
          </td>
        );
      })}

      {/* Sticky row actions */}
      <td className="sticky right-0 z-[2] h-9 bg-surface-default px-1 align-middle shadow-[-2px_0_10px_rgba(2,24,43,0.06)] group-hover/row:bg-surface-muted/40">
        <div className="flex items-center justify-end gap-0.5">
          <button
            type="button"
            className="inline-flex size-6.5 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-primary-50 hover:text-primary-600"
            title="Link competition data"
            onClick={onOpenLinkPicker}
          >
            <Link2 className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            className="inline-flex size-6.5 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600"
            title="Delete row"
            onClick={onDeleteRow}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        </div>
      </td>
    </tr>
  );
}

export default CompetitionManagementTableRow;
