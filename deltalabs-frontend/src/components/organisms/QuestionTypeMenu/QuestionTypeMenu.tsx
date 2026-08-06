/**
 * QuestionTypeMenu
 * Atomic Level: Organism
 *
 * "Question Type" dropdown for the Competition Workspace canvas: an outlined
 * pill button with a dark caret that toggles a floating rounded menu of question
 * types (z-indexed above the editor canvas, closes on outside click / Escape).
 * Value is controlled via `value`; the menu just reports selection.
 * @example <QuestionTypeMenu value={type} onSelect={setType} />
 */

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";

import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export const QUESTION_TYPE_OPTIONS = [
  "Multiple Choice",
  "True / False",
  "Fill-in-the-Blanks",
  "Matching",
  "Writing / Essay",
  "Ordering / Sequencing",
] as const;

export interface QuestionTypeMenuProps {
  value?: string;
  onSelect: (type: string) => void;
  /** When true the coding canvas remains the active authoring surface. */
  disabled?: boolean;
  className?: string;
}

export function QuestionTypeMenu({
  value,
  onSelect,
  disabled = false,
  className,
}: Readonly<QuestionTypeMenuProps>) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const activeType =
    value && (QUESTION_TYPE_OPTIONS as readonly string[]).includes(value)
      ? value
      : undefined;

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex h-auto items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
      >
        <Typography as="span" className="text-sm font-medium text-text-primary">
          {activeType ?? "Question Type"}
        </Typography>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-primary-800 transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="Question type"
          className="absolute z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border-default bg-surface-default p-1 shadow-md"
        >
          {QUESTION_TYPE_OPTIONS.map((type) => {
            const selected = activeType === type;
            return (
              <li key={type} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    onSelect(type);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-muted"
                >
                  {type}
                  {selected && <Check className="size-4 text-primary-700" aria-hidden />}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default QuestionTypeMenu;