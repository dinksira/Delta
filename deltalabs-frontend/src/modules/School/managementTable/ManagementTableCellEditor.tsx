"use client";

import { useEffect, useState } from "react";

import type { ManagementTableColumnDto } from "@/modules/School/api";

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
      className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm leading-snug outline-none focus:border-primary-300"
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
  return (
    <textarea
      className="min-h-[2rem] w-full min-w-0 resize-y rounded border border-transparent bg-transparent px-1 py-0.5 text-sm leading-snug outline-none focus:border-primary-300"
      rows={2}
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
      className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm leading-snug outline-none focus:border-primary-300"
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
}: Readonly<{
  column: ManagementTableColumnDto;
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
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
        className="w-full min-w-0 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm leading-snug outline-none focus:border-primary-300"
        value={typeof value === "string" ? value.slice(0, 10) : ""}
        onChange={(e) => onCommit(e.target.value, true)}
      />
    );
  }
  if (t === "textarea") {
    return <TextareaCellEditor value={value} onCommit={onCommit} />;
  }
  if (t === "dropdown" || t === "status") {
    const opts = optionList(column.settings);
    const strVal = typeof value === "string" ? value : "";
    return (
      <select
        className="w-full max-w-full rounded border border-transparent bg-transparent py-0.5 text-sm leading-snug outline-none focus:border-primary-300"
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
