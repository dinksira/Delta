"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDownUp,
  ArrowLeftRight,
  ChevronRight,
  Copy,
  Filter,
  LayoutGrid,
  Minimize2,
  MoreHorizontal,
  Pencil,
  Plus,
  Puzzle,
  Settings,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnDto } from "@/modules/School/api";
import { deleteManagementTableColumn, patchManagementTableColumn } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

export type ManagementTableColumnHeadCellProps = Readonly<{
  orgId: string;
  schoolId: string;
  definitionId: string;
  instanceId: string;
  column: ManagementTableColumnDto;
  columnCount: number;
  enabled: boolean;
}>;

function MenuDivider() {
  return <div className="my-1 h-px bg-border-default" role="separator" />;
}

export function ManagementTableColumnHeadCell({
  orgId,
  schoolId,
  definitionId,
  instanceId,
  column,
  columnCount,
  enabled,
}: ManagementTableColumnHeadCellProps) {
  const queryClient = useQueryClient();
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuPanelRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(column.title);

  const invalidateSchema = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.managementTableInstance(orgId, schoolId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "management-tables", "definitions", orgId, schoolId],
    });
  }, [queryClient, orgId, schoolId, instanceId]);

  const patchMutation = useMutation({
    mutationFn: (title: string) =>
      patchManagementTableColumn(orgId, schoolId, definitionId, column.id, { title }),
    onSuccess: async () => {
      setInlineEditing(false);
      setMenuOpen(false);
      await invalidateSchema();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteManagementTableColumn(orgId, schoolId, definitionId, column.id),
    onSuccess: async () => {
      setMenuOpen(false);
      setInlineEditing(false);
      await invalidateSchema();
    },
  });

  useEffect(() => {
    if (!inlineEditing) setDraftTitle(column.title);
  }, [column.title, inlineEditing]);

  useEffect(() => {
    if (inlineEditing) {
      titleInputRef.current?.focus();
      titleInputRef.current?.select?.();
    }
  }, [inlineEditing]);

  const commitTitle = useCallback(() => {
    const next = draftTitle.trim();
    if (!next) {
      setDraftTitle(column.title);
      setInlineEditing(false);
      return;
    }
    if (next === column.title) {
      setInlineEditing(false);
      return;
    }
    patchMutation.mutate(next);
  }, [column.title, draftTitle, patchMutation]);

  const cancelInlineEdit = useCallback(() => {
    setDraftTitle(column.title);
    setInlineEditing(false);
  }, [column.title]);

  const beginInlineEdit = useCallback(() => {
    setMenuOpen(false);
    setDraftTitle(column.title);
    setInlineEditing(true);
  }, [column.title]);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 260;
    const left = Math.max(8, Math.min(r.right - width, window.innerWidth - width - 8));
    setMenuPos({ top: r.bottom + 4, left });
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    updateMenuPosition();
    const onScroll = () => updateMenuPosition();
    const onResize = () => updateMenuPosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [menuOpen, updateMenuPosition]);

  useEffect(() => {
    if (!menuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (menuPanelRef.current?.contains(t) || triggerRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [menuOpen]);

  const canRemove = columnCount > 1;

  const menuItemClass =
    "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-text-primary transition-colors hover:bg-surface-muted";

  const menuItemDisabled =
    "flex w-full cursor-not-allowed items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm text-text-tertiary/60";

  if (!enabled) {
    return (
      <div className="flex min-h-[38px] items-stretch">
        <div className="flex min-w-0 flex-1 items-center px-2 py-1.5 text-xs font-semibold text-text-primary">
          {column.title}
        </div>
        <span className="inline-flex w-8 shrink-0 items-center justify-center self-stretch opacity-30">
          <MoreHorizontal className="size-4" aria-hidden />
        </span>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[38px] w-full items-stretch">
      {inlineEditing ? (
        <>
          <input
            ref={titleInputRef}
            type="text"
            value={draftTitle}
            maxLength={200}
            disabled={patchMutation.isPending}
            className={[
              "absolute inset-0 z-[6] box-border min-h-full w-full border-2 border-primary-500 bg-[#e8edf3] px-2 py-1.5",
              "text-center text-xs font-semibold text-text-primary caret-text-primary outline-none focus:border-sky-500",
              "ring-0 focus:ring-0",
            ].join(" ")}
            aria-label="Column name"
            onChange={(e) => setDraftTitle(e.target.value)}
            onBlur={() => {
              if (patchMutation.isPending) return;
              commitTitle();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                titleInputRef.current?.blur();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                cancelInlineEdit();
              }
            }}
          />
          {patchMutation.isError ? (
            <div
              className="pointer-events-none absolute bottom-1 left-2 right-2 z-[7] truncate text-center text-[11px] text-red-600"
              role="alert"
            >
              {patchMutation.error instanceof ApiError ? patchMutation.error.message : "Could not save."}
            </div>
          ) : null}
        </>
      ) : (
        <>
          <button
            type="button"
            className="min-w-0 flex-1 select-none px-2 py-1.5 text-left text-xs font-semibold leading-snug text-text-primary transition-colors hover:bg-white/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-500"
            title="Double-click to rename"
            onDoubleClick={(e) => {
              e.preventDefault();
              beginInlineEdit();
            }}
          >
            {column.title}
          </button>
          <button
            ref={triggerRef}
            type="button"
            className={[
              "inline-flex w-8 shrink-0 items-center justify-center self-stretch border-l border-white/80 text-text-secondary transition-colors",
              "opacity-0 group-hover/colhead:opacity-100 group-focus-within/colhead:opacity-100 focus-visible:opacity-100",
              menuOpen ? "bg-white/90 opacity-100" : "hover:bg-white/55",
            ].join(" ")}
            aria-expanded={menuOpen}
            aria-haspopup="true"
            aria-controls={menuOpen ? menuId : undefined}
            aria-label={`More actions for column ${column.title}`}
            onClick={(e) => {
              e.stopPropagation();
              if (menuOpen) {
                setMenuOpen(false);
                return;
              }
              updateMenuPosition();
              setMenuOpen(true);
            }}
          >
            <MoreHorizontal className="size-4" aria-hidden />
          </button>
        </>
      )}

      {menuOpen && menuPos && !inlineEditing
        ? createPortal(
            <div
              ref={menuPanelRef}
              id={menuId}
              role="menu"
              className="fixed z-[4500] min-w-[260px] max-w-[min(320px,calc(100vw-16px))] rounded-xl border border-border-default bg-surface-default py-1.5 text-text-primary shadow-xl"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Settings className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Settings</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Filter className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">Filter</span>
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <ArrowDownUp className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Sort</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Minimize2 className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">Collapse</span>
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <LayoutGrid className="size-4 shrink-0" aria-hidden />
                <span className="flex-1">Group by</span>
              </button>
              <MenuDivider />
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Copy className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Duplicate column</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Plus className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Add column to the right</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <ArrowLeftRight className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Change column type</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <MenuDivider />
              <button type="button" role="menuitem" className={menuItemDisabled} disabled>
                <Puzzle className="size-4 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1">Column extensions</span>
                <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
              </button>
              <MenuDivider />
              <button type="button" role="menuitem" className={menuItemClass} onClick={() => beginInlineEdit()}>
                <Pencil className="size-4 shrink-0 text-text-secondary" aria-hidden />
                <span className="flex-1 font-medium">Rename</span>
              </button>
              <button
                type="button"
                role="menuitem"
                className={
                  canRemove
                    ? `${menuItemClass} text-red-700 hover:bg-red-50`
                    : `${menuItemDisabled} text-red-400/60`
                }
                disabled={!canRemove || deleteMutation.isPending}
                onClick={() => {
                  if (!canRemove) return;
                  if (
                    !window.confirm(
                      `Remove column “${column.title}”? Row data for this field will stay in the database but will no longer appear in the table.`,
                    )
                  ) {
                    return;
                  }
                  deleteMutation.mutate();
                }}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 font-medium">Remove</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
