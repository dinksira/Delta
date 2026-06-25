"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/theme";
import type {
  AttendanceFormulaConfig,
  AttendanceFormulaMode,
  AttendanceFormulaOperation,
} from "@/modules/School/attendance/attendanceColumnConfig";
import { formatFormulaExpression } from "@/modules/School/attendance/attendanceFormulaEngine";
import {
  sessionColumnToken,
  validateCustomFormulaExpression,
} from "@/modules/School/attendance/attendanceFormulaExpression";
import type { AttendanceSessionRecord } from "@/modules/School/attendance/types";

const CUSTOM_EXAMPLES = [
  "{Session 1} * 0.5 + {Session 2}",
  "SUM({Session 1}, {Session 2}, {Session 3})",
  "AVERAGE({Session 1}, {Session 2}) * 100",
  "COUNT({Session 1}, {Session 2}, {Session 3}, {Session 4})",
] as const;

function ClassAttendanceFormulaConfigPopover({
  open,
  onClose,
  anchorRef,
  config,
  sessions,
  canMutate,
  onSave,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  config: AttendanceFormulaConfig;
  sessions: readonly AttendanceSessionRecord[];
  canMutate: boolean;
  onSave: (next: AttendanceFormulaConfig) => void;
}>) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState(config);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (open) setDraft(config);
  }, [config, open]);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: Math.max(8, rect.left - 140) });
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [anchorRef, onClose, open]);

  const customError = useMemo(() => {
    if (draft.mode !== "custom") return null;
    return validateCustomFormulaExpression(draft.customExpression, sessions);
  }, [draft.customExpression, draft.mode, sessions]);

  if (!open || !pos || typeof document === "undefined") return null;

  const allIds = sessions.map((s) => s.id);

  const isSessionIncluded = (sessionId: string) =>
    draft.sessionIds.length === 0 || draft.sessionIds.includes(sessionId);

  const toggleSession = (sessionId: string) => {
    setDraft((prev) => {
      const effective = prev.sessionIds.length > 0 ? prev.sessionIds : allIds;
      const set = new Set(effective);
      if (set.has(sessionId)) set.delete(sessionId);
      else set.add(sessionId);
      const next = [...set];
      if (next.length === allIds.length) return { ...prev, sessionIds: [] };
      return { ...prev, sessionIds: next };
    });
  };

  const setMode = (mode: AttendanceFormulaMode) => setDraft((d) => ({ ...d, mode }));

  const insertColumnToken = (title: string) => {
    const token = sessionColumnToken(title);
    const el = textareaRef.current;
    if (!el) {
      setDraft((d) => ({ ...d, customExpression: `${d.customExpression}${token}` }));
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? start;
    const next = `${el.value.slice(0, start)}${token}${el.value.slice(end)}`;
    setDraft((d) => ({ ...d, customExpression: next }));
    requestAnimationFrame(() => {
      el.focus();
      const caret = start + token.length;
      el.setSelectionRange(caret, caret);
    });
  };

  const applyDisabled = !canMutate || (draft.mode === "custom" && Boolean(customError));

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Formula settings"
      className="fixed z-[210] w-[min(26rem,calc(100vw-1rem))] rounded-xl border border-border-default bg-surface-default p-4 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <p className="text-sm font-semibold text-text-primary">Formula column</p>
      <p className="mt-1 text-xs leading-relaxed text-text-tertiary">
        Reference session columns with <span className="font-mono">{`{Session 1}`}</span> — like monday.com formulas.
      </p>

      <div className="mt-3 flex rounded-lg border border-border-default p-0.5">
        <button
          type="button"
          className={[
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            draft.mode === "preset" ? "bg-primary-700 text-white" : "text-text-secondary hover:bg-surface-muted",
          ].join(" ")}
          onClick={() => setMode("preset")}
        >
          Quick
        </button>
        <button
          type="button"
          className={[
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            draft.mode === "custom" ? "bg-primary-700 text-white" : "text-text-secondary hover:bg-surface-muted",
          ].join(" ")}
          onClick={() => setMode("custom")}
        >
          Custom expression
        </button>
      </div>

      {draft.mode === "preset" ? (
        <>
          <label className="mt-4 block text-xs font-medium text-text-secondary">
            Function
            <select
              value={draft.operation}
              disabled={!canMutate}
              onChange={(e) => setDraft((d) => ({ ...d, operation: e.target.value as AttendanceFormulaOperation }))}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
            >
              <option value="sum">SUM — total present marks</option>
              <option value="average">AVERAGE — mean across columns</option>
              <option value="count_present">COUNT — present/late sessions</option>
            </select>
          </label>

          <fieldset className="mt-4">
            <legend className="text-xs font-medium text-text-secondary">Columns to include</legend>
            <p className="mt-0.5 text-[11px] text-text-tertiary">None selected = all session columns.</p>
            <ul className="mt-2 max-h-32 space-y-1.5 overflow-y-auto">
              {sessions.map((session) => (
                <li key={session.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted">
                    <input
                      type="checkbox"
                      checked={isSessionIncluded(session.id)}
                      disabled={!canMutate}
                      onChange={() => toggleSession(session.id)}
                    />
                    <span className="truncate text-text-primary">{session.title}</span>
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        </>
      ) : (
        <>
          <label className="mt-4 block text-xs font-medium text-text-secondary">
            Expression
            <textarea
              ref={textareaRef}
              value={draft.customExpression}
              disabled={!canMutate}
              onChange={(e) => setDraft((d) => ({ ...d, customExpression: e.target.value }))}
              rows={4}
              placeholder="{Session 1} * 0.5 + {Session 2}"
              className="mt-1 w-full resize-y rounded-md border border-border-default bg-surface-default px-3 py-2 font-mono text-xs leading-relaxed"
            />
          </label>

          <div className="mt-2">
            <p className="text-[11px] font-medium text-text-tertiary">Insert column</p>
            <div className="mt-1 flex flex-wrap gap-1">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  disabled={!canMutate}
                  onClick={() => insertColumnToken(session.title)}
                  className="rounded-full border border-border-default bg-surface-muted/50 px-2 py-0.5 font-mono text-[10px] text-text-secondary hover:bg-surface-muted"
                >
                  {sessionColumnToken(session.title)}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2">
            <p className="text-[11px] font-medium text-text-tertiary">Examples</p>
            <ul className="mt-1 space-y-1">
              {CUSTOM_EXAMPLES.map((ex) => (
                <li key={ex}>
                  <button
                    type="button"
                    disabled={!canMutate}
                    onClick={() => setDraft((d) => ({ ...d, customExpression: ex }))}
                    className="font-mono text-[10px] text-primary-700 hover:underline"
                  >
                    {ex}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <p className="mt-2 text-[11px] text-text-tertiary">
            Supports <span className="font-mono">+ - * / ( )</span> and{" "}
            <span className="font-mono">SUM()</span>, <span className="font-mono">AVERAGE()</span>,{" "}
            <span className="font-mono">COUNT()</span>, <span className="font-mono">MIN()</span>,{" "}
            <span className="font-mono">MAX()</span>. Each session cell = 1 if present/late, else 0.
          </p>

          {customError ? <p className="mt-2 text-xs text-red-600">{customError}</p> : null}
        </>
      )}

      <div className="mt-3 rounded-md bg-surface-muted/50 px-3 py-2">
        <p className="text-[10px] font-medium uppercase tracking-wide text-text-tertiary">Preview</p>
        <p className="mt-0.5 break-all font-mono text-xs text-text-primary">{formatFormulaExpression(draft, sessions)}</p>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={applyDisabled}
          onClick={() => {
            onSave(draft);
            onClose();
          }}
        >
          Apply
        </Button>
      </div>
    </div>,
    document.body,
  );
}

/** Clickable Formula column header — opens user formula config. */
export function ClassAttendanceFormulaColumnHead({
  config,
  sessions,
  canMutate,
  onSave,
}: Readonly<{
  config: AttendanceFormulaConfig;
  sessions: readonly AttendanceSessionRecord[];
  canMutate: boolean;
  onSave: (next: AttendanceFormulaConfig) => void;
}>) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [open, setOpen] = useState(false);
  const expression = formatFormulaExpression(config, sessions);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full min-h-[2.25rem] max-w-[11rem] flex-col items-start gap-0.5 px-2 py-1.5 text-left transition-colors hover:bg-white/50"
        title={canMutate ? "Configure formula" : expression}
      >
        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
          Formula
          <ChevronDown className="size-3" aria-hidden />
        </span>
        <span className="max-w-full truncate font-mono text-[10px] text-text-tertiary">{expression}</span>
      </button>
      <ClassAttendanceFormulaConfigPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={anchorRef}
        config={config}
        sessions={sessions}
        canMutate={canMutate}
        onSave={onSave}
      />
    </>
  );
}
