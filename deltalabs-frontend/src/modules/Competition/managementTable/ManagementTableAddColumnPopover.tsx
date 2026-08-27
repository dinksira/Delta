/**
 * ManagementTableAddColumnPopover
 *
 * Popover panel for adding a new column to the management table.
 * Displays searchable groups of column-type options.
 *
 * @example
 * ```tsx
 * <ManagementTableAddColumnPopover open anchor={null} popoverRef={ref} search="" onSearchChange={() => {}} groups={[]} onPick={() => {}} />
 * ```
 */

"use client";

import type { RefObject } from "react";

import { createPortal } from "react-dom";
import { Search } from "lucide-react";

import type {
  ManagementTableAddColumnGroup,
  ManagementTableAddColumnOption,
} from "@/modules/Competition/managementTable/columnTypeMeta";

// ===== TYPES =====

// ===== COMPONENT =====

export function ManagementTableAddColumnPopover({
  open,
  anchor,
  popoverRef,
  search,
  onSearchChange,
  groups,
  onPick,
  pending = false,
  zIndex = 4000,
}: Readonly<{
  open: boolean;
  anchor: { top: number; left: number; width: number } | null;
  popoverRef: RefObject<HTMLDivElement | null>;
  search: string;
  onSearchChange: (value: string) => void;
  groups: readonly ManagementTableAddColumnGroup[];
  onPick: (option: ManagementTableAddColumnOption) => void;
  pending?: boolean;
  zIndex?: number;
}>) {
  if (!open || !anchor || typeof document === "undefined") return null;

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed w-[min(22rem,calc(100vw-1rem))] rounded-2xl border border-border-default bg-surface-muted p-4 shadow-xl"
      style={{
        zIndex,
        top: `${Math.max(8, anchor.top)}px`,
        left: `${Math.max(8, Math.min(anchor.left, window.innerWidth - 368))}px`,
      }}
      role="dialog"
      aria-label="Add column"
    >
      <label className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default px-4 py-3">
        <Search className="size-5 shrink-0 text-text-tertiary" aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search column types"
          className="min-w-0 flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-tertiary"
          autoFocus
        />
      </label>
      <div className="mt-4 max-h-72 space-y-4 overflow-y-auto">
        {groups.length === 0 ? (
          <p className="py-6 text-center text-xs text-text-tertiary">No column types match your search.</p>
        ) : (
          groups.map((group) => (
            <div key={group.title}>
              <p className="mb-2 text-sm font-medium text-text-tertiary">{group.title}</p>
              <div className="grid grid-cols-2 gap-2">
                {group.options.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      opt.supportedType
                        ? "bg-transparent text-text-secondary hover:bg-white/55 hover:text-text-primary"
                        : "cursor-not-allowed bg-transparent text-text-tertiary hover:bg-white/40",
                    ].join(" ")}
                    onClick={() => onPick(opt)}
                    disabled={pending}
                  >
                    <opt.icon className="size-5 shrink-0" aria-hidden />
                    <span className="truncate">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>,
    document.body,
  );
}
