/**
 * ManagementTableColumnHeadCell
 *
 * Renders the header cell for a single column in the management table.
 * Supports inline rename, context menu with delete, and sort controls.
 *
 * @example
 * ```tsx
 * <ManagementTableColumnHeadCell orgId="o" definitionId="d" instanceId="i" column={col} columnCount={3} enabled />
 * ```
 */

"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";

import { ApiError } from "@/lib/apiClient";
import {
  deleteCompetitionManagementTableColumn,
  patchCompetitionManagementTableColumn,
} from "@/modules/Competition/managementTable/api";
import { competitionQueryKeys } from "@/modules/Competition/managementTable/competitionQueryKeys";

// ===== TYPES =====

export type ManagementTableColumnHeadCellProps = Readonly<{
  orgId: string;
  definitionId: string;
  instanceId: string;
  column: { id: string; title: string; type: string; order: number; settings?: Record<string, unknown> };
  columnCount: number;
  enabled: boolean;
}>;

// ===== COMPONENT =====

export function ManagementTableColumnHeadCell({
  orgId,
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
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [inlineEditing, setInlineEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(column.title);

  const invalidateSchema = useCallback(async () => {
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.instanceBundle(orgId, instanceId),
    });
    await queryClient.invalidateQueries({
      queryKey: competitionQueryKeys.definitions(orgId),
    });
  }, [queryClient, orgId, instanceId]);

  const patchMutation = useMutation({
    mutationFn: (title: string) =>
      patchCompetitionManagementTableColumn(definitionId, column.id, { title }, orgId),
    onSuccess: async () => {
      setInlineEditing(false);
      setMenuOpen(false);
      await invalidateSchema();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteCompetitionManagementTableColumn(definitionId, column.id, orgId),
    onSuccess: async () => {
      setConfirmRemoveOpen(false);
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
    if (!next || next === column.title) {
      setDraftTitle(column.title);
      setInlineEditing(false);
      return;
    }
    patchMutation.mutate(next);
  }, [column.title, draftTitle, patchMutation]);

  const beginInlineEdit = useCallback(() => {
    setMenuOpen(false);
    setDraftTitle(column.title);
    setInlineEditing(true);
  }, [column.title]);

  const updateMenuPosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 220;
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

  // ===== HELPERS =====

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
              "absolute inset-0 z-[6] box-border min-h-full w-full border-2 border-primary-500 bg-surface-muted px-2 py-1.5",
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
                setDraftTitle(column.title);
                setInlineEditing(false);
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
              setMenuOpen((o) => !o);
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
              className="fixed z-[4500] min-w-[220px] rounded-xl border border-border-default bg-surface-default py-1.5 text-text-primary shadow-xl"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
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
                  setMenuOpen(false);
                  setConfirmRemoveOpen(true);
                }}
              >
                <Trash2 className="size-4 shrink-0" aria-hidden />
                <span className="flex-1 font-medium">Remove</span>
              </button>
            </div>,
            document.body,
          )
        : null}

      {confirmRemoveOpen && typeof document !== "undefined"
        ? createPortal(
            <div className="fixed inset-0 z-[5000] flex items-center justify-center bg-black/40">
              <div className="w-full max-w-sm rounded-xl border border-border-default bg-surface-default p-6 shadow-xl">
                <h3 className="text-base font-semibold text-text-primary">
                  Remove column &ldquo;{column.title}&rdquo;?
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Row data for this field will stay in the database but will no longer appear in the table.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-border-default px-3 py-1.5 text-sm font-medium text-text-secondary hover:bg-surface-muted"
                    disabled={deleteMutation.isPending}
                    onClick={() => setConfirmRemoveOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                    disabled={deleteMutation.isPending}
                    onClick={() => deleteMutation.mutate()}
                  >
                    {deleteMutation.isPending ? "Removing…" : "Remove"}
                  </button>
                </div>
                {deleteMutation.isError ? (
                  <p className="mt-2 text-xs text-red-600">
                    {deleteMutation.error instanceof ApiError
                      ? deleteMutation.error.message
                      : "Could not remove column."}
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
