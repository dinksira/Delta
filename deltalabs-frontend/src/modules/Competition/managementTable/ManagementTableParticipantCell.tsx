/**
 * ManagementTableParticipantCell
 *
 * Monday.com-style participants/scale metric cell.
 * Displays current players / capacity with a mini visual fill track.
 *
 * @example
 * ```tsx
 * <ManagementTableParticipantCell value="12/32" onCommit={handleCommit} />
 * ```
 */

"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";

// ===== TYPES =====

export interface ManagementTableParticipantCellProps {
  readonly value: unknown;
  readonly onCommit: (next: unknown, immediate?: boolean) => void;
}

// ===== COMPONENT =====

export function ManagementTableParticipantCell({
  value,
  onCommit,
}: Readonly<ManagementTableParticipantCellProps>) {
  const [editing, setEditing] = useState(false);
  const rawStr = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(rawStr);

  useEffect(() => {
    setDraft(rawStr);
  }, [rawStr]);

  // Parse "X/Y" or just "X"
  const parts = rawStr.split("/").map((s) => Number(s.trim()));
  const current = !Number.isNaN(parts[0]) ? parts[0] : 0;
  const max = parts.length > 1 && !Number.isNaN(parts[1]) && parts[1] > 0 ? parts[1] : 100;
  const percent = Math.min(100, Math.max(0, Math.round((current / max) * 100)));

  if (editing) {
    return (
      <input
        type="text"
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          setEditing(false);
          if (draft !== rawStr) onCommit(draft, true);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            setEditing(false);
            if (draft !== rawStr) onCommit(draft, true);
          } else if (e.key === "Escape") {
            setDraft(rawStr);
            setEditing(false);
          }
        }}
        className="h-7 w-full rounded border border-primary-500 bg-surface-default px-1.5 text-xs text-text-primary outline-none"
      />
    );
  }

  if (!rawStr) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="h-7 w-full rounded border border-transparent px-1 text-left text-xs text-text-tertiary hover:border-border-default"
      >
        —
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={`${rawStr} players (click to edit)`}
      className="group flex h-7 w-full items-center gap-1.5 rounded border border-transparent px-1 hover:border-border-default"
    >
      <Users className="size-3 shrink-0 text-text-tertiary group-hover:text-primary-600" aria-hidden />
      <span className="shrink-0 text-xs font-semibold tabular-nums text-text-primary">
        {rawStr}
      </span>
      <div className="h-1.5 min-w-8 flex-1 overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </button>
  );
}

export default ManagementTableParticipantCell;
