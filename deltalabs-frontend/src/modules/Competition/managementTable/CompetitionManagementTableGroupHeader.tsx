/**
 * CompetitionManagementTableGroupHeader
 *
 * Monday.com-style collapsible group header.
 * Displays colored accent bar, toggle chevron, group title, item count pill,
 * and quick-add / group menu actions.
 *
 * @example
 * ```tsx
 * <CompetitionManagementTableGroupHeader title="Active Competitions" count={5} collapsed={false} onToggle={() => {}} />
 * ```
 */

"use client";

import { useId, useState } from "react";
import { ChevronDown, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { GROUP_COLOR_KEYS, type GroupColorKey, resolveGroupColor } from "./columnTypeMeta";

// ===== TYPES =====

export interface CompetitionManagementTableGroupHeaderProps {
  readonly title: string;
  readonly count: number;
  readonly collapsed: boolean;
  readonly colorKey?: string;
  readonly onToggleCollapse: () => void;
  readonly onAddRow: () => void;
  readonly onDeleteGroup?: () => void;
  readonly onColorChange?: (color: GroupColorKey) => void;
  readonly addRowPending?: boolean;
}

// ===== COMPONENT =====

export function CompetitionManagementTableGroupHeader({
  title,
  count,
  collapsed,
  colorKey,
  onToggleCollapse,
  onAddRow,
  onDeleteGroup,
  onColorChange,
  addRowPending,
}: Readonly<CompetitionManagementTableGroupHeaderProps>) {
  const menuId = useId();
  const [menuOpen, setMenuOpen] = useState(false);
  const colorTheme = resolveGroupColor(colorKey);

  return (
    <div className="relative mb-1 flex items-center justify-between gap-3 px-1 py-1.5">
      <div className="flex min-w-0 items-center gap-2">
        {/* Collapse toggle button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          className={`inline-flex size-6 shrink-0 items-center justify-center rounded transition-transform hover:bg-surface-muted ${colorTheme.text}`}
          title={collapsed ? "Expand group" : "Collapse group"}
          aria-expanded={!collapsed}
        >
          <ChevronDown
            className={`size-4 transition-transform duration-200 ${collapsed ? "-rotate-90" : "rotate-0"}`}
            aria-hidden
          />
        </button>

        {/* Group title with color accent */}
        <div className="flex items-center gap-2">
          <h2 className={`text-base font-bold tracking-tight ${colorTheme.text}`}>{title}</h2>
          <span className="inline-flex items-center rounded-full bg-surface-muted px-2 py-0.5 text-xs font-semibold tabular-nums text-text-secondary">
            {count} {count === 1 ? "item" : "items"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Quick Add Row in Header */}
        <button
          type="button"
          onClick={onAddRow}
          disabled={addRowPending}
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition-colors hover:bg-surface-muted disabled:opacity-50 ${colorTheme.text}`}
          title="Add competition to this group"
        >
          <Plus className="size-3.5" aria-hidden />
          <span className="hidden sm:inline">Add</span>
        </button>

        {/* Group options menu */}
        {onDeleteGroup || onColorChange ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((prev) => !prev)}
              className="inline-flex size-7 items-center justify-center rounded text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-primary"
              title="Group options"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <MoreHorizontal className="size-4" aria-hidden />
            </button>

            {menuOpen ? (
              <>
                <div
                  aria-hidden="true"
                  className="fixed inset-0 z-[200]"
                  onClick={() => setMenuOpen(false)}
                />
                <div
                  id={menuId}
                  role="menu"
                  className="absolute right-0 top-8 z-[210] w-48 rounded-xl border border-border-default bg-surface-default p-2 shadow-xl"
                >
                  {/* Color picker */}
                  {onColorChange ? (
                    <div className="mb-2 border-b border-border-default pb-2">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary">
                        Group Color
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 px-2">
                        {GROUP_COLOR_KEYS.map((k) => {
                          const col = resolveGroupColor(k);
                          return (
                            <button
                              key={k}
                              type="button"
                              onClick={() => {
                                onColorChange(k);
                                setMenuOpen(false);
                              }}
                              className={`size-4.5 rounded-full ${col.fill} transition-transform hover:scale-125 focus:ring-2 focus:ring-primary-500`}
                              title={col.label}
                            />
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  {onDeleteGroup ? (
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDeleteGroup();
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete group
                    </button>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default CompetitionManagementTableGroupHeader;
