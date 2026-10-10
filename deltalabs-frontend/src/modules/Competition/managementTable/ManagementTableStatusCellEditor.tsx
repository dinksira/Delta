/**
 * ManagementTableStatusCellEditor
 *
 * Monday.com-style status cell editor.
 * Displays a full-width colored status pill. On click, opens a popover
 * showing status choices with color tokens, keyboard navigation, and immediate commit.
 *
 * @example
 * ```tsx
 * <ManagementTableStatusCellEditor column={col} value={val} onCommit={handleCommit} />
 * ```
 */

"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { Check } from "lucide-react";

import {
  DEFAULT_COMPETITION_STATUS_OPTIONS,
  STATUS_TONE_CLASSES,
  type ManagementTableStatusOption,
  type ManagementTableStatusTone,
} from "./columnTypeMeta";

// ===== TYPES =====

export interface ManagementTableStatusCellEditorProps {
  readonly column: {
    readonly id: string;
    readonly title: string;
    readonly settings?: Record<string, unknown>;
  };
  readonly value: unknown;
  readonly onCommit: (next: unknown, immediate?: boolean) => void;
}

// ===== COMPONENT =====

export function ManagementTableStatusCellEditor({
  column,
  value,
  onCommit,
}: Readonly<ManagementTableStatusCellEditorProps>) {
  const popoverId = useId();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const options: readonly ManagementTableStatusOption[] = useMemo(() => {
    const raw = column.settings?.options;
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.map((o) => {
        const id = String(o?.id ?? "");
        const label = String(o?.label ?? id);
        const tone = (o?.tone as ManagementTableStatusTone) || "default";
        return { id, label, tone };
      });
    }
    return DEFAULT_COMPETITION_STATUS_OPTIONS;
  }, [column.settings?.options]);

  const currentOption = useMemo(() => {
    const str = typeof value === "string" ? value.trim().toLowerCase() : "";
    if (!str) return null;
    return (
      options.find((o) => o.id.toLowerCase() === str || o.label.toLowerCase() === str) ?? {
        id: str,
        label: typeof value === "string" ? value : String(value),
        tone: "default" as ManagementTableStatusTone,
      }
    );
  }, [options, value]);

  const activeTone = currentOption?.tone ?? "default";
  const toneStyle = STATUS_TONE_CLASSES[activeTone] ?? STATUS_TONE_CLASSES.default;

  const handleSelect = useCallback(
    (opt: ManagementTableStatusOption) => {
      onCommit(opt.label, true);
      setOpen(false);
    },
    [onCommit],
  );

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex h-7 w-full items-center justify-center rounded px-2 text-center text-xs font-semibold shadow-xs transition-transform active:scale-95 ${toneStyle.bg} ${toneStyle.text} ${toneStyle.ring ?? ""}`}
        title={`Status: ${currentOption?.label ?? "Not set"}`}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{currentOption?.label ?? "—"}</span>
      </button>

      {open ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[200]"
            onClick={() => setOpen(false)}
          />
          <div
            id={popoverId}
            role="listbox"
            aria-label="Select competition status"
            className="absolute left-0 top-8 z-[210] w-48 rounded-xl border border-border-default bg-surface-default p-1.5 shadow-xl"
            onKeyDown={(e) => {
              if (e.key === "Escape") setOpen(false);
            }}
          >
            <div className="space-y-1">
              {options.map((opt) => {
                const optStyle = STATUS_TONE_CLASSES[opt.tone] ?? STATUS_TONE_CLASSES.default;
                const isSelected = currentOption?.id === opt.id || currentOption?.label === opt.label;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`flex h-7 w-full items-center justify-between rounded px-2.5 text-xs font-semibold transition-opacity hover:opacity-90 ${optStyle.bg} ${optStyle.text}`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected ? <Check className="size-3.5 shrink-0" aria-hidden /> : null}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

export default ManagementTableStatusCellEditor;
