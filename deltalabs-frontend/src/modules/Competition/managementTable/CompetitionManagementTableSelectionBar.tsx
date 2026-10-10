/**
 * CompetitionManagementTableSelectionBar
 *
 * Monday.com-style floating batch selection toolbar.
 * Replicates School's ManagementTableSelectionBar capabilities:
 * - Selected count indicator
 * - Move up & Move down row reordering
 * - Bulk Delete with confirmation
 * - Clear selection
 * 100% design-token compliant (no arbitrary hex values).
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableSelectionBar
 *   selectedCount={1}
 *   canMoveUp={true}
 *   canMoveDown={false}
 *   onMoveUp={handleMoveUp}
 *   onMoveDown={handleMoveDown}
 *   onDelete={handleDelete}
 *   onClear={handleClear}
 * />
 * ```
 */

"use client";

import { createPortal } from "react-dom";
import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";

// ===== TYPES =====

export interface CompetitionManagementTableSelectionBarProps {
  readonly selectedCount: number;
  readonly canMoveUp?: boolean;
  readonly canMoveDown?: boolean;
  readonly onMoveUp?: () => void;
  readonly onMoveDown?: () => void;
  readonly onDelete: () => void;
  readonly onClear: () => void;
  readonly busy?: boolean;
}

// ===== COMPONENT =====

export function CompetitionManagementTableSelectionBar({
  selectedCount,
  canMoveUp = false,
  canMoveDown = false,
  onMoveUp,
  onMoveDown,
  onDelete,
  onClear,
  busy = false,
}: Readonly<CompetitionManagementTableSelectionBarProps>) {
  if (selectedCount < 1 || typeof document === "undefined") return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-8 z-[300] flex justify-center px-4">
      <div
        role="toolbar"
        aria-label="Row selection actions"
        className="pointer-events-auto flex items-center gap-1.5 rounded-2xl border border-border-default bg-surface-default px-3 py-1.5 shadow-2xl transition-all sm:gap-2 sm:px-4 sm:py-2"
      >
        {/* Count badge */}
        <div className="flex items-center gap-2 pr-2 border-r border-border-default">
          <span className="inline-flex size-6 items-center justify-center rounded-full bg-primary-600 text-xs font-bold text-white">
            {selectedCount}
          </span>
          <span className="text-xs font-semibold text-text-primary">
            {selectedCount === 1 ? "1 item selected" : `${selectedCount} items selected`}
          </span>
        </div>

        {/* Reorder actions (when exactly 1 row is selected) */}
        {onMoveUp && onMoveDown ? (
          <div className="flex items-center gap-1 border-r border-border-default pr-2">
            <button
              type="button"
              disabled={!canMoveUp || busy}
              onClick={onMoveUp}
              className="inline-flex size-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
              title="Move item up"
              aria-label="Move item up"
            >
              <ArrowUp className="size-3.5" aria-hidden />
            </button>
            <button
              type="button"
              disabled={!canMoveDown || busy}
              onClick={onMoveDown}
              className="inline-flex size-7 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary disabled:opacity-40"
              title="Move item down"
              aria-label="Move item down"
            >
              <ArrowDown className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : null}

        {/* Bulk Delete action */}
        <button
          type="button"
          disabled={busy}
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
          title="Delete selected items"
        >
          <Trash2 className="size-3.5" aria-hidden />
          <span>Delete</span>
        </button>

        {/* Clear selection button */}
        <button
          type="button"
          onClick={onClear}
          className="inline-flex size-7 items-center justify-center rounded-lg text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
          title="Clear selection"
          aria-label="Clear selection"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}

export default CompetitionManagementTableSelectionBar;
