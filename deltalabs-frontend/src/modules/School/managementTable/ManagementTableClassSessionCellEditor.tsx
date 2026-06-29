"use client";

import { CalendarClock, CircleHelp, RotateCw, Search } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { ClassSessionDto } from "@/modules/School/api";
import { fetchClassSessions } from "@/modules/School/api";
import {
  classSessionCellValueToJson,
  formatClassSessionCellLabel,
  parseClassSessionCellValue,
  type ManagementTableClassSessionCellValue,
} from "@/modules/School/managementTable/managementTableClassSessionCell";

function sessionTypeLabel(type: ClassSessionDto["sessionType"]): string {
  switch (type) {
    case "in_person":
      return "In person";
    case "hybrid":
      return "Hybrid";
    default:
      return "Virtual";
  }
}

function SessionPickerRow({
  session,
  onPick,
}: Readonly<{ session: ClassSessionDto; onPick: (session: ClassSessionDto) => void }>) {
  const subtitle = [
    sessionTypeLabel(session.sessionType),
    session.durationMinutes ? `${session.durationMinutes} min` : null,
    session.status !== "draft" ? session.status : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-border-default/80 bg-surface-muted/20 px-3 py-2.5 text-left transition-all hover:border-primary-300 hover:bg-surface-muted/60 hover:shadow-sm"
      onClick={() => onPick(session)}
    >
      <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <RotateCw className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text-primary">{session.title}</span>
        {subtitle ? <span className="block truncate text-xs text-text-tertiary">{subtitle}</span> : null}
      </span>
    </button>
  );
}

export function ManagementTableClassSessionCellEditor({
  orgId,
  schoolId,
  classWorkspaceItemId,
  value,
  onCommit,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classWorkspaceItemId: string;
  value: unknown;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<readonly ClassSessionDto[]>([]);
  const [pos, setPos] = useState<{ top: number; left: number; caretLeft: number } | null>(null);

  const selected = useMemo(() => parseClassSessionCellValue(value), [value]);
  const label = formatClassSessionCellLabel(value);
  const hasSelection = Boolean(selected.sessionId || label);

  const syncPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 320;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - width - 8));
    const caretLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - left - 6), width - 24);
    setPos({ top: rect.bottom + 10, left, caretLeft });
  }, []);

  useEffect(() => {
    if (!open) {
      setPos(null);
      setQuery("");
      return;
    }
    syncPos();
  }, [open, syncPos]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => syncPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, syncPos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !classWorkspaceItemId) return;
    let cancelled = false;
    setLoading(true);
    void fetchClassSessions(orgId, schoolId, classWorkspaceItemId)
      .then((response) => {
        if (!cancelled) setSessions(response.items);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, orgId, schoolId, classWorkspaceItemId]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sessions;
    return sessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [query, sessions]);

  const pick = (session: ClassSessionDto) => {
    const next: ManagementTableClassSessionCellValue = {
      sessionId: session.id,
      title: session.title,
    };
    onCommit(classSessionCellValueToJson(next), true);
    setOpen(false);
  };

  const clearSelection = () => {
    onCommit({}, true);
    setOpen(false);
  };

  const listContent = (() => {
    if (loading) {
      return <p className="px-2 py-5 text-center text-xs text-text-tertiary">Loading class sessions…</p>;
    }
    if (sessions.length === 0) {
      return (
        <p className="px-2 py-5 text-center text-xs leading-relaxed text-text-tertiary">
          No sessions on this class yet. Create sessions on the Class tab first.
        </p>
      );
    }
    if (filteredSessions.length === 0) {
      return <p className="px-2 py-5 text-center text-xs text-text-tertiary">No sessions match your search.</p>;
    }
    return (
      <ul className="space-y-2">
        {filteredSessions.map((session) => (
          <li key={session.id}>
            <SessionPickerRow session={session} onPick={pick} />
          </li>
        ))}
      </ul>
    );
  })();

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        className={[
          "inline-flex min-h-8 min-w-8 max-w-full items-center gap-2 rounded-full text-left transition-colors",
          hasSelection
            ? "px-1 py-0.5 hover:bg-surface-muted/60"
            : "size-8 justify-center border-2 border-dashed border-border-default bg-surface-muted/20 hover:border-primary-400 hover:bg-surface-muted/50",
          open ? "ring-2 ring-primary-500/35 ring-offset-1" : "",
        ].join(" ")}
        onClick={() => setOpen((v) => !v)}
        title={label || "Select class session"}
      >
        {hasSelection ? (
          <>
            <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
              <RotateCw className="size-3.5" aria-hidden />
            </span>
            <span className="max-w-[9rem] truncate text-sm font-medium text-text-primary">{label}</span>
          </>
        ) : (
          <CalendarClock className="size-4 text-text-tertiary" aria-hidden />
        )}
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label="Select class session"
              className="fixed z-[4600] w-[min(20rem,calc(100vw-1rem))] overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-[0_12px_40px_rgba(2,24,43,0.18)]"
              style={{ top: pos.top, left: pos.left }}
            >
              <div
                className="absolute -top-1.5 h-3 w-3 rotate-45 border-l border-t border-border-default bg-surface-default"
                style={{ left: pos.caretLeft }}
                aria-hidden
              />

              <div className="relative border-b border-border-default p-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search class sessions"
                    className="h-10 w-full rounded-lg border border-primary-500 bg-surface-default pl-9 pr-9 text-sm text-text-primary outline-none ring-2 ring-primary-500/25 placeholder:text-text-tertiary"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
                    title="Search tips"
                    onClick={() =>
                      window.alert(
                        "Sessions listed here are created on this class Class tab. Search by title, then pick one to link it to this schedule row.",
                      )
                    }
                  >
                    <CircleHelp className="size-3.5" aria-hidden />
                  </button>
                </label>
              </div>

              <div className="relative max-h-72 overflow-y-auto px-2 py-2">
                <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                    {query.trim() ? "Results" : "Class sessions"}
                  </span>
                  {hasSelection ? (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-red-600 hover:underline"
                      onClick={clearSelection}
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
                {listContent}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
