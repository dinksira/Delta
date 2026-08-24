"use client";

import { useEffect, useState } from "react";

import type { ManagementTableColumnDto, SchoolMemberSearchPicker } from "@/modules/School/api";
import { columnUsesClassSessionPicker } from "@/modules/School/managementTable/managementTableClassSessionCell";
import { ManagementTableClassSessionCellEditor } from "@/modules/School/managementTable/ManagementTableClassSessionCellEditor";
import { isGhostDeepLink, parseGhostDeepLink } from "@/modules/School/managementTable/managementTableGhostCell";
import {
  columnUsesMultiPersonPicker,
  columnUsesPersonPicker,
  resolvePersonPickerForColumn,
} from "@/modules/School/managementTable/managementTablePersonCell";
import { ManagementTablePersonCellEditor } from "@/modules/School/managementTable/ManagementTablePersonCellEditor";

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
      className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-sm leading-none outline-none focus:border-primary-300"
      value={numDraft}
      onChange={(e) => setNumDraft(e.target.value)}
      onBlur={() => {
        const v = numDraft === "" ? null : Number(numDraft);
        onCommit(v !== null && Number.isNaN(v) ? null : v, true);
      }}
    />
  );
}

function TextareaCellEditor({
  value,
  onCommit,
}: Readonly<{
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const str =
    typeof value === "string" || typeof value === "number" ? String(value) : value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(str);
  useEffect(() => {
    setDraft(str);
  }, [str]);
  // Compact single-line in board; full text still editable (scroll horizontally / tooltip).
  return (
    <input
      type="text"
      title={draft || undefined}
      className="h-7 w-full min-w-0 truncate rounded border border-transparent bg-transparent px-1 text-sm leading-none outline-none focus:border-primary-300"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== str) onCommit(draft, true);
      }}
    />
  );
}

function DefaultTextCellEditor({
  columnType,
  value,
  onCommit,
}: Readonly<{
  columnType: ManagementTableColumnDto["type"];
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const str =
    typeof value === "string" || typeof value === "number" ? String(value) : value === null || value === undefined ? "" : String(value);
  const [draft, setDraft] = useState(str);
  useEffect(() => {
    setDraft(str);
  }, [str]);
  return (
    <input
      type={columnType === "link" ? "url" : "text"}
      className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-sm leading-none outline-none focus:border-primary-300"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== str) onCommit(draft, true);
      }}
    />
  );
}

export function ManagementTableCellEditor({
  column,
  value,
  onCommit,
  orgId,
  schoolId,
  personPicker = "school_students",
  classWorkspaceItemId,
  onOpenGhost,
  onOpenWork,
}: Readonly<{
  column: ManagementTableColumnDto;
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
  orgId?: string;
  schoolId?: string;
  personPicker?: SchoolMemberSearchPicker;
  classWorkspaceItemId?: string;
  /** Opens Ghost drawer for `ghost:{id}` deep-link cells (any column type). */
  onOpenGhost?: (ghostId: string) => void;
  onOpenWork?: (openKey: string) => void;
}>) {
  if (columnUsesClassSessionPicker(column) && orgId && schoolId && classWorkspaceItemId) {
    return (
      <ManagementTableClassSessionCellEditor
        orgId={orgId}
        schoolId={schoolId}
        classWorkspaceItemId={classWorkspaceItemId}
        value={value}
        onCommit={onCommit}
      />
    );
  }

  if (columnUsesPersonPicker(column) && orgId && schoolId) {
    return (
      <ManagementTablePersonCellEditor
        orgId={orgId}
        schoolId={schoolId}
        personPicker={resolvePersonPickerForColumn(column, personPicker)}
        classWorkspaceItemId={classWorkspaceItemId}
        value={value}
        multi={columnUsesMultiPersonPicker(column)}
        onCommit={onCommit}
      />
    );
  }

  const ghostId = parseGhostDeepLink(value);
  if (ghostId) {
    const showWork = Boolean(onOpenWork && isGhostDeepLink(value));
    return (
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-primary-800 underline-offset-2 hover:bg-primary-50 hover:underline"
          title="Open ghost"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onOpenGhost?.(ghostId);
          }}
        >
          Ghost
        </button>
        {showWork ? (
          <button
            type="button"
            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-sm font-semibold text-[#2f5d73] underline-offset-2 hover:bg-[#eef4f8] hover:underline"
            title="Open work"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof value === "string") onOpenWork?.(value);
            }}
          >
            Work
          </button>
        ) : null}
      </div>
    );
  }

  const t = column.type;
  if (t === "checkbox") {
    return (
      <input
        type="checkbox"
        className="size-3.5 rounded border-border-default"
        checked={Boolean(value)}
        onChange={(e) => onCommit(e.target.checked, true)}
      />
    );
  }
  if (t === "number") {
    return <NumberCellEditor value={value} onCommit={onCommit} />;
  }
  if (t === "date") {
    return (
      <input
        type="date"
        className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-sm leading-none outline-none focus:border-primary-300"
        value={typeof value === "string" ? value.slice(0, 10) : ""}
        onChange={(e) => onCommit(e.target.value, true)}
      />
    );
  }
  if (t === "textarea") {
    return <TextareaCellEditor value={value} onCommit={onCommit} />;
  }
  const cellEditor = column.settings?.cellEditor;
  if (cellEditor === "time" || column.title.trim().toLowerCase() === "time") {
    const timeVal = typeof value === "string" ? value.slice(0, 5) : "";
    return (
      <input
        type="time"
        className="h-7 w-full min-w-0 rounded border border-transparent bg-transparent px-1 text-sm leading-none outline-none focus:border-primary-300"
        value={timeVal}
        onChange={(e) => onCommit(e.target.value, true)}
      />
    );
  }
  if (t === "dropdown" || t === "status") {
    const opts = optionList(column.settings);
    const strVal = typeof value === "string" ? value : "";
    return (
      <select
        className="h-7 w-full max-w-full rounded border border-transparent bg-transparent text-sm leading-none outline-none focus:border-primary-300"
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
