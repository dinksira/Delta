"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import type { GhostImplementationType } from "@/modules/School/api";
import {
  IMPLEMENTATION_OPTIONS,
  implementationLabel,
} from "@/modules/School/ghost/types";

/** Figma Implementation Type dropdown (Same Base / Branch Base). */
export function ImplementationTypeSelect({
  value,
  disabled,
  onChange,
  className,
}: Readonly<{
  value: GhostImplementationType;
  disabled?: boolean;
  onChange: (next: GhostImplementationType) => void;
  className?: string;
}>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={rootRef} className={["relative", className].filter(Boolean).join(" ")}>
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-w-[8.5rem] items-center justify-between gap-2 rounded-lg border border-[#c5d0da] bg-white px-3 py-2 text-sm font-medium text-[#0f2a3d] shadow-sm hover:bg-surface-muted/40 disabled:opacity-50"
      >
        <span>{implementationLabel(value)}</span>
        <ChevronDown className="size-4 shrink-0 text-[#5a6b7a]" aria-hidden />
      </button>
      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute right-0 z-20 mt-1 min-w-full overflow-hidden rounded-lg border border-[#c5d0da] bg-white py-1 shadow-lg"
        >
          {IMPLEMENTATION_OPTIONS.map((opt) => {
            const selected = opt.value === value;
            return (
              <li key={opt.value} role="option" aria-selected={selected}>
                <button
                  type="button"
                  className={[
                    "flex w-full px-3 py-2 text-left text-sm",
                    selected
                      ? "bg-[#e8eef2] font-semibold text-[#0f2a3d]"
                      : "text-[#0f2a3d] hover:bg-surface-muted/60",
                  ].join(" ")}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
