"use client";

import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import { createPortal } from "react-dom";

export function ManagementTableSelectionBar({
  selectedCount,
  canDelete,
  deleteDisabledReason,
  canMoveUp,
  canMoveDown,
  busy,
  onDelete,
  onMoveUp,
  onMoveDown,
  onClear,
}: Readonly<{
  selectedCount: number;
  canDelete: boolean;
  deleteDisabledReason?: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
  busy: boolean;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClear: () => void;
}>) {
  if (selectedCount < 1 || typeof document === "undefined") return null;

  const label = selectedCount === 1 ? "Item selected" : "Items selected";

  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 bottom-[4.75rem] z-[180] flex justify-center px-3">
      <div
        role="toolbar"
        aria-label="Row selection actions"
        className="pointer-events-auto flex max-w-full items-center gap-1 rounded-2xl border border-[#d5e0e8] bg-white px-2 py-1.5 shadow-[0_8px_28px_rgba(2,24,43,0.18)] sm:gap-2 sm:px-3 sm:py-2"
      >
        <div className="flex min-w-0 items-center gap-2 pl-1 pr-2 sm:pr-3">
          <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#2f5d73] text-xs font-bold text-white">
            {selectedCount}
          </span>
          <span className="truncate text-sm font-medium text-[#0f2a3d]">{label}</span>
        </div>

        <span className="hidden h-8 w-px shrink-0 bg-[#e3ebf1] sm:block" aria-hidden />

        <div className="flex items-center gap-0.5 sm:gap-1">
          <SelectionAction
            label="Move up"
            disabled={!canMoveUp || busy}
            onClick={onMoveUp}
            icon={<ArrowUp className="size-4" aria-hidden />}
          />
          <SelectionAction
            label="Move down"
            disabled={!canMoveDown || busy}
            onClick={onMoveDown}
            icon={<ArrowDown className="size-4" aria-hidden />}
          />
          <SelectionAction
            label="Delete"
            disabled={!canDelete || busy}
            title={!canDelete ? deleteDisabledReason : undefined}
            onClick={onDelete}
            icon={<Trash2 className="size-4" aria-hidden />}
            danger
          />
        </div>

        <span className="mx-0.5 h-8 w-px shrink-0 bg-[#e3ebf1]" aria-hidden />

        <button
          type="button"
          className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg text-[#5a7184] hover:bg-[#f0f4f7] hover:text-[#0f2a3d]"
          aria-label="Clear selection"
          disabled={busy}
          onClick={onClear}
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>,
    document.body,
  );
}

function SelectionAction({
  label,
  icon,
  disabled,
  onClick,
  title,
  danger,
}: Readonly<{
  label: string;
  icon: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  title?: string;
  danger?: boolean;
}>) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={title ?? label}
      aria-label={label}
      onClick={onClick}
      className={[
        "inline-flex min-w-[3.25rem] flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-[10px] font-medium transition-colors",
        disabled
          ? "cursor-not-allowed text-[#a8b6c3] opacity-60"
          : danger
            ? "text-[#b42318] hover:bg-red-50"
            : "text-[#2f5d73] hover:bg-[#eef4f8]",
      ].join(" ")}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
