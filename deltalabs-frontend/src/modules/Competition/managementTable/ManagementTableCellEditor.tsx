/**
 * ManagementTableCellEditor.tsx
 *
 * Dispatches to the appropriate Monday.com-style inline editor for each column type.
 *
 * @example
 * ```tsx
 * <ManagementTableCellEditor column={col} value={val} onCommit={setVal} />
 * ```
 */

"use client";

import { useEffect, useState } from "react";
import { ManagementTableParticipantCell } from "./ManagementTableParticipantCell";
import { ManagementTableStatusCellEditor } from "./ManagementTableStatusCellEditor";
import { ManagementTableTimelineCell } from "./ManagementTableTimelineCell";

// ===== HELPERS =====

function optionList(settings: Readonly<Record<string, unknown>>): { id: string; label: string }[] {
  const opts = settings.options;
  if (!Array.isArray(opts)) return [];
  return opts
    .map((o) => {
      if (o && typeof o === "object" && "id" in o && "label" in o) {
        return { id: String((o as { id: unknown }).id), label: String((o as { label: unknown }).label) };
      }
      return null;
    })
    .filter((x): x is { id: string; label: string } => x !== null);
}

function CurrencyCellEditor({
  value,
  onCommit,
}: Readonly<{
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const str = value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(str);
  useEffect(() => {
    setDraft(str);
  }, [str]);
  return (
    <div className="flex h-7 w-full items-center gap-1 rounded border border-transparent px-1 focus-within:border-primary-300">
      <span className="shrink-0 text-[10px] font-bold text-text-tertiary">ETB</span>
      <input
        type="text"
        className="w-full min-w-0 bg-transparent text-xs font-semibold tabular-nums text-text-primary outline-none"
        value={draft}
        placeholder="0"
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== str) onCommit(draft, true);
        }}
      />
    </div>
  );
}

function NumberCellEditor({
  value,
  onCommit,
}: Readonly<{
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const numStr = value === null || value === undefined ? "" : String(value);
  const [numDraft, setNumDraft] = useState(numStr);
  useEffect(() => {
    setNumDraft(numStr);
  }, [numStr]);
  return (
    <input
      type="number"
      className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-xs tabular-nums text-text-primary outline-none focus:border-primary-300"
      value={numDraft}
      onChange={(e) => setNumDraft(e.target.value)}
      onBlur={() => {
        const v = numDraft === "" ? null : Number(numDraft);
        onCommit(v !== null && Number.isNaN(v) ? null : v, true);
      }}
    />
  );
}

function DefaultTextCellEditor({
  columnType,
  value,
  onCommit,
}: Readonly<{
  columnType: string;
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const str =
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : value === null || value === undefined
        ? ""
        : String(value);
  const [draft, setDraft] = useState(str);
  useEffect(() => {
    setDraft(str);
  }, [str]);
  return (
    <input
      type={columnType === "link" ? "url" : "text"}
      className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-xs text-text-primary outline-none focus:border-primary-300"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== str) onCommit(draft, true);
      }}
    />
  );
}

// ===== COMPONENT =====

export function ManagementTableCellEditor({
  column,
  value,
  onCommit,
}: Readonly<{
  column: { id: string; title: string; type: string; settings?: Record<string, unknown> };
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const t = column.type;
  const lowerTitle = column.title.trim().toLowerCase();

  // Status column -> Monday.com full-bleed status badge editor
  if (t === "status") {
    return <ManagementTableStatusCellEditor column={column} value={value} onCommit={onCommit} />;
  }

  // Players / participants column -> Meter cell
  if (lowerTitle.includes("player") || lowerTitle.includes("participant")) {
    return <ManagementTableParticipantCell value={value} onCommit={onCommit} />;
  }

  // Date / timeline column -> Timeline cell
  if (t === "date" || lowerTitle.includes("date") || lowerTitle.includes("timeline")) {
    return <ManagementTableTimelineCell value={value} onCommit={onCommit} />;
  }

  // Prize pool / entry fee -> Currency formatted cell
  if (lowerTitle.includes("prize") || lowerTitle.includes("fee")) {
    return <CurrencyCellEditor value={value} onCommit={onCommit} />;
  }

  // Checkbox
  if (t === "checkbox") {
    return (
      <div className="flex h-7 items-center justify-center">
        <input
          type="checkbox"
          className="size-4 rounded border-border-default text-primary-600 focus:ring-primary-500"
          checked={Boolean(value)}
          onChange={(e) => onCommit(e.target.checked, true)}
        />
      </div>
    );
  }

  // Number
  if (t === "number") {
    return <NumberCellEditor value={value} onCommit={onCommit} />;
  }

  // Dropdown
  if (t === "dropdown") {
    const opts = optionList(column.settings ?? {});
    const strVal = typeof value === "string" ? value : "";
    return (
      <select
        className="h-7 w-full max-w-full rounded border border-transparent bg-transparent text-xs text-text-primary outline-none focus:border-primary-300"
        value={strVal}
        onChange={(e) => onCommit(e.target.value, true)}
      >
        <option value="">—</option>
        {opts.map((o) => (
          <option key={o.id} value={o.id}>
            {o.label}
          </option>
        ))}
      </select>
    );
  }

  return <DefaultTextCellEditor columnType={t} value={value} onCommit={onCommit} />;
}

export default ManagementTableCellEditor;
