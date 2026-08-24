"use client";

import { CircleHelp, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { SchoolMemberSearchPicker, SchoolMemberSearchUserDto } from "@/modules/School/api";
import { searchSchoolMembers } from "@/modules/School/api";
import {
  formatPersonCellLabel,
  parsePersonCellPeople,
  parsePersonCellValue,
  peopleCellValueToJson,
  personCellValueToJson,
  type ManagementTablePersonCellValue,
} from "@/modules/School/managementTable/managementTablePersonCell";

const AVATAR_PALETTE = [
  "#7c3aed",
  "#2563eb",
  "#0891b2",
  "#ca8a04",
  "#16a34a",
  "#db2777",
  "#ea580c",
  "#4f46e5",
] as const;

function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length] ?? AVATAR_PALETTE[0];
}

function displayNameForUser(user: SchoolMemberSearchUserDto): string {
  return user.fullName?.trim() || user.username?.trim() || user.email?.trim() || "Person";
}

function initialsForName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function PersonAvatar({
  name,
  seed,
  size = "md",
}: Readonly<{ name: string; seed: string; size?: "sm" | "md" }>) {
  const dim = size === "sm" ? "size-7 text-[11px]" : "size-8 text-xs";
  return (
    <span
      className={["inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white", dim].join(
        " ",
      )}
      style={{ backgroundColor: avatarColor(seed) }}
      aria-hidden
    >
      {initialsForName(name)}
    </span>
  );
}

function PersonPickerRow({
  user,
  onPick,
}: Readonly<{ user: SchoolMemberSearchUserDto; onPick: (user: SchoolMemberSearchUserDto) => void }>) {
  const name = displayNameForUser(user);
  const subtitle = user.email?.trim() || user.username?.trim() || null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-3 rounded-xl border border-border-default/80 bg-surface-muted/20 px-3 py-2.5 text-left transition-all hover:border-primary-300 hover:bg-surface-muted/60 hover:shadow-sm"
      onClick={() => onPick(user)}
    >
      <PersonAvatar name={name} seed={user.userId} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-text-primary">{name}</span>
        {subtitle ? (
          <span className="block truncate text-xs text-text-tertiary">{subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

export function ManagementTablePersonCellEditor({
  orgId,
  schoolId,
  personPicker = "school_students",
  classWorkspaceItemId,
  value,
  multi = false,
  onCommit,
}: Readonly<{
  orgId: string;
  schoolId: string;
  personPicker?: SchoolMemberSearchPicker;
  classWorkspaceItemId?: string;
  value: unknown;
  /** Monday-style: add multiple people in one cell. */
  multi?: boolean;
  onCommit: (next: unknown, immediate?: boolean) => void;
}>) {
  const panelId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<readonly SchoolMemberSearchUserDto[]>([]);
  const [pos, setPos] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    caretLeft: number;
    maxHeight: number;
    placement: "above" | "below";
  } | null>(null);

  const people = useMemo(() => parsePersonCellPeople(value), [value]);
  const person = useMemo(() => parsePersonCellValue(value), [value]);
  const label = formatPersonCellLabel(value);
  const hasSelection = multi ? people.length > 0 : Boolean(person.userId || label);
  const selectedIds = useMemo(
    () => new Set(people.map((p) => p.userId?.trim()).filter(Boolean) as string[]),
    [people],
  );

  const syncPos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = 320;
    const gap = 10;
    const edge = 8;
    // Course bottom nav (~64–80px) sits fixed; keep picker clear of it.
    const bottomChrome = 88;
    const left = Math.max(edge, Math.min(rect.left, window.innerWidth - width - edge));
    const caretLeft = Math.min(Math.max(16, rect.left + rect.width / 2 - left - 6), width - 24);

    const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - bottomChrome - edge);
    const spaceAbove = Math.max(0, rect.top - edge);
    const measured = panelRef.current?.offsetHeight ?? 0;
    const preferredHeight = measured > 0 ? measured : 360;
    const openBelow =
      spaceBelow >= Math.min(preferredHeight, 260) || spaceBelow >= spaceAbove;

    if (openBelow) {
      const maxHeight = Math.max(160, spaceBelow - gap);
      setPos({
        top: rect.bottom + gap,
        left,
        caretLeft,
        maxHeight,
        placement: "below",
      });
      return;
    }

    const maxHeight = Math.max(160, spaceAbove - gap);
    setPos({
      bottom: window.innerHeight - rect.top + gap,
      left,
      caretLeft,
      maxHeight,
      placement: "above",
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setPos(null);
      setQuery("");
      setResults([]);
      return;
    }
    syncPos();
  }, [open, syncPos]);

  // Re-measure after content/results change so flip + max-height stay accurate.
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => syncPos());
    return () => window.cancelAnimationFrame(id);
  }, [open, syncPos, results.length, people.length, query, loading]);

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
    if (!open) return;
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchSchoolMembers(
          orgId,
          schoolId,
          trimmed,
          20,
          personPicker,
          personPicker === "class_students" ? classWorkspaceItemId : undefined,
        );
        setResults(response.items);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [open, orgId, personPicker, query, schoolId, classWorkspaceItemId]);

  const pick = (user: SchoolMemberSearchUserDto) => {
    const next: ManagementTablePersonCellValue = {
      userId: user.userId,
      fullName: user.fullName,
      username: user.username,
      email: user.email,
    };
    if (!multi) {
      onCommit(personCellValueToJson(next), true);
      setOpen(false);
      return;
    }
    if (selectedIds.has(user.userId)) {
      const filtered = people.filter((p) => p.userId !== user.userId);
      onCommit(peopleCellValueToJson(filtered), true);
      return;
    }
    onCommit(peopleCellValueToJson([...people, next]), true);
    setQuery("");
  };

  const clearSelection = () => {
    onCommit(multi ? peopleCellValueToJson([]) : {}, true);
    setOpen(false);
  };

  const removePerson = (userId: string) => {
    onCommit(
      peopleCellValueToJson(people.filter((p) => p.userId !== userId)),
      true,
    );
  };

  const emptyMessage =
    personPicker === "platform"
      ? "No matching Delta Labs accounts."
      : personPicker === "school_parents"
        ? "No school parents found. Register them in the school parent workspace first."
        : personPicker === "class_students"
          ? "No students on this class yet. Add them on the Student tab first."
          : "No school students found. Register them in the school student workspace first.";

  const personLabel =
    personPicker === "school_parents"
      ? "parent"
      : personPicker === "class_students" || personPicker === "school_students"
        ? "student"
        : multi
          ? "people"
          : "person";

  const listContent = (() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return (
        <p className="px-2 py-5 text-center text-xs leading-relaxed text-text-tertiary">
          {personPicker === "platform"
            ? "Type at least 2 characters to search Delta Labs accounts."
            : personPicker === "school_parents"
              ? "Type at least 2 characters to search school parents."
              : personPicker === "class_students"
                ? "Type at least 2 characters to search students on this class."
                : "Type at least 2 characters to search school students."}
        </p>
      );
    }
    if (loading) {
      return <p className="px-2 py-5 text-center text-xs text-text-tertiary">Searching…</p>;
    }
    if (results.length === 0) {
      return <p className="px-2 py-5 text-center text-xs text-text-tertiary">{emptyMessage}</p>;
    }
    return (
      <ul className="space-y-2">
        {results.map((user) => {
          const selected = multi && selectedIds.has(user.userId);
          return (
            <li key={user.userId}>
              {multi ? (
                <button
                  type="button"
                  className={[
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-all",
                    selected
                      ? "border-primary-400 bg-primary-50"
                      : "border-border-default/80 bg-surface-muted/20 hover:border-primary-300 hover:bg-surface-muted/60",
                  ].join(" ")}
                  onClick={() => pick(user)}
                >
                  <PersonAvatar name={displayNameForUser(user)} seed={user.userId} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-text-primary">
                      {displayNameForUser(user)}
                    </span>
                    <span className="block truncate text-xs text-text-tertiary">
                      {selected ? "Click to remove" : user.email?.trim() || user.username?.trim() || ""}
                    </span>
                  </span>
                </button>
              ) : (
                <PersonPickerRow user={user} onPick={pick} />
              )}
            </li>
          );
        })}
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
          "inline-flex min-h-8 min-w-8 max-w-full items-center gap-1 rounded-full text-left transition-colors",
          hasSelection
            ? "px-1 py-0.5 hover:bg-surface-muted/60"
            : "size-8 justify-center border-2 border-dashed border-border-default bg-surface-muted/20 hover:border-primary-400 hover:bg-surface-muted/50",
          open ? "ring-2 ring-primary-500/35 ring-offset-1" : "",
        ].join(" ")}
        onClick={() => setOpen((v) => !v)}
        title={label || `Assign ${personLabel}`}
      >
        {hasSelection ? (
          multi ? (
            <span className="inline-flex items-center">
              {people.slice(0, 3).map((p, idx) => {
                const name = p.fullName?.trim() || p.username?.trim() || p.email?.trim() || "?";
                return (
                  <span
                    key={p.userId || `${name}-${idx}`}
                    className={idx > 0 ? "-ml-1.5" : ""}
                    style={{ zIndex: 3 - idx }}
                  >
                    <PersonAvatar name={name} seed={p.userId || name} size="sm" />
                  </span>
                );
              })}
              {people.length > 3 ? (
                <span className="ml-1 text-[11px] font-semibold text-text-secondary">
                  +{people.length - 3}
                </span>
              ) : null}
            </span>
          ) : (
            <>
              <PersonAvatar name={label || "Student"} seed={person.userId || label} size="sm" />
              <span className="max-w-[9rem] truncate text-sm font-medium text-text-primary">{label}</span>
            </>
          )
        ) : (
          <UserRound className="size-4 text-text-tertiary" aria-hidden />
        )}
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="true"
              aria-label={`Select ${personLabel}`}
              className="fixed z-[4600] flex w-[min(20rem,calc(100vw-1rem))] flex-col overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-[0_12px_40px_rgba(2,24,43,0.18)]"
              style={{
                top: pos.top,
                bottom: pos.bottom,
                left: pos.left,
                maxHeight: pos.maxHeight,
              }}
            >
              <div
                className={[
                  "absolute h-3 w-3 rotate-45 border-border-default bg-surface-default",
                  pos.placement === "below"
                    ? "-top-1.5 border-l border-t"
                    : "-bottom-1.5 border-b border-r",
                ].join(" ")}
                style={{ left: pos.caretLeft }}
                aria-hidden
              />

              {multi && people.length > 0 ? (
                <div className="flex shrink-0 flex-wrap gap-1.5 border-b border-border-default px-3 py-2.5">
                  {people.map((p) => {
                    const name = p.fullName?.trim() || p.username?.trim() || p.email?.trim() || "Person";
                    return (
                      <button
                        key={p.userId || name}
                        type="button"
                        className="inline-flex items-center gap-1 rounded-full bg-[#e8eef2] py-0.5 pl-0.5 pr-2 text-[11px] font-medium text-[#0f2a3d] hover:bg-[#d5dee6]"
                        title={`Remove ${name}`}
                        onClick={() => p.userId && removePerson(p.userId)}
                      >
                        <PersonAvatar name={name} seed={p.userId || name} size="sm" />
                        <span className="max-w-[6rem] truncate">{name}</span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="relative shrink-0 border-b border-border-default p-3">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder={
                      multi
                        ? "Add people by name or email"
                        : personPicker === "platform"
                          ? "Search name, username, or email"
                          : personPicker === "school_parents"
                            ? "Search registered school parents"
                            : personPicker === "class_students"
                              ? "Search students on this class"
                              : "Search registered school students"
                    }
                    className="h-10 w-full rounded-lg border border-primary-500 bg-surface-default pl-9 pr-9 text-sm text-text-primary outline-none ring-2 ring-primary-500/25 placeholder:text-text-tertiary"
                    autoFocus
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
                    title="Search tips"
                    onClick={() =>
                      window.alert(
                        multi
                          ? "Assign one or more people who can edit and submit this ghost work."
                          : personPicker === "platform"
                            ? "Search any Delta Labs account by name, username, or email. Picking someone registers them at this school."
                            : personPicker === "school_parents"
                              ? "Search parents already registered at this school. Add new parents from the school parent workspace first."
                              : personPicker === "class_students"
                                ? "Only students already on this class Student tab appear here. Add students there first."
                                : "Search students already registered at this school. Add new students from the school student workspace first.",
                      )
                    }
                  >
                    <CircleHelp className="size-3.5" aria-hidden />
                  </button>
                </label>
              </div>

              <div className="relative min-h-0 flex-1 overflow-y-auto px-2 py-2">
                <div className="flex items-center justify-between px-2 pb-1.5 pt-1">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-text-tertiary">
                    {query.trim().length >= 2
                      ? "Results"
                      : multi
                        ? "Assignees"
                        : personPicker === "school_parents"
                          ? "Suggested parents"
                          : personPicker === "class_students"
                            ? "Class students"
                            : personPicker === "platform"
                              ? "Suggested accounts"
                              : "Suggested students"}
                  </span>
                  {hasSelection ? (
                    <button
                      type="button"
                      className="text-[11px] font-medium text-red-600 hover:underline"
                      onClick={clearSelection}
                    >
                      {multi ? "Clear all" : "Clear"}
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
