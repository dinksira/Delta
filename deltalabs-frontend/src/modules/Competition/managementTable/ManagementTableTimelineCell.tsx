/**
 * ManagementTableTimelineCell
 *
 * Monday.com-style timeline & date cell editor.
 * Displays formatted date with optional countdown pill, editable inline.
 *
 * @example
 * ```tsx
 * <ManagementTableTimelineCell value="2026-10-15" onCommit={handleCommit} />
 * ```
 */

"use client";

import { useId, useMemo, useState } from "react";
import { Calendar } from "lucide-react";

// ===== TYPES =====

export interface ManagementTableTimelineCellProps {
  readonly value: unknown;
  readonly onCommit: (next: unknown, immediate?: boolean) => void;
}

// ===== HELPERS =====

function formatRelativeBadge(dateStr: string): { label: string; tone: "upcoming" | "past" | "today" } | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;

  const now = new Date();
  const diffDays = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return { label: "Today", tone: "today" };
  if (diffDays > 0) return { label: `${diffDays}d left`, tone: "upcoming" };
  return { label: "Ended", tone: "past" };
}

// ===== COMPONENT =====

export function ManagementTableTimelineCell({
  value,
  onCommit,
}: Readonly<ManagementTableTimelineCellProps>) {
  const inputId = useId();
  const [editing, setEditing] = useState(false);
  const dateVal = typeof value === "string" ? value.slice(0, 10) : "";

  const relative = useMemo(() => formatRelativeBadge(dateVal), [dateVal]);

  if (editing) {
    return (
      <input
        id={inputId}
        type="date"
        autoFocus
        value={dateVal}
        onChange={(e) => onCommit(e.target.value, true)}
        onBlur={() => setEditing(false)}
        className="h-7 w-full rounded border border-primary-500 bg-surface-default px-1 text-xs text-text-primary outline-none"
      />
    );
  }

  if (!dateVal) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="flex h-7 w-full items-center gap-1 rounded border border-transparent px-1 text-xs text-text-tertiary hover:border-border-default"
      >
        <Calendar className="size-3" aria-hidden />
        <span>Set date</span>
      </button>
    );
  }

  const badgeToneClass =
    relative?.tone === "today"
      ? "bg-warning-50 text-warning-700 border-warning-200"
      : relative?.tone === "upcoming"
        ? "bg-primary-50 text-primary-700 border-primary-200"
        : "bg-surface-muted text-text-tertiary border-border-default";

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      title={`Date: ${dateVal} (click to change)`}
      className="flex h-7 w-full items-center justify-between gap-1 rounded border border-transparent px-1 hover:border-border-default"
    >
      <span className="flex min-w-0 items-center gap-1 text-xs font-medium text-text-primary">
        <Calendar className="size-3 shrink-0 text-text-tertiary" aria-hidden />
        <span className="truncate">{dateVal}</span>
      </span>
      {relative ? (
        <span
          className={`shrink-0 rounded border px-1 py-0.5 text-[9px] font-semibold ${badgeToneClass}`}
        >
          {relative.label}
        </span>
      ) : null}
    </button>
  );
}

export default ManagementTableTimelineCell;
