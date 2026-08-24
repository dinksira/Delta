/**
 * DeliverableList — editable ordered list of design deliverables.
 *
 * One input row per deliverable (index badge + text + remove), with an
 * "Add deliverable" action capped by `max`. Mirrors the reorder/remove chrome of
 * the Ordering question rows. Fully controlled via `items` + `onChange`.
 *
 * @example
 * <DeliverableList
 *   items={question.design.deliverables}
 *   onChange={(deliverables) => onChange({ design: { ...question.design, deliverables } })}
 * />
 */

import { Plus } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Input } from "@/components/theme/Input";
import { cn } from "@/lib/utils";

export interface DeliverableListProps {
  items: string[];
  onChange: (items: string[]) => void;
  /** Maximum number of deliverables (default 6). */
  max?: number;
  disabled?: boolean;
  className?: string;
}

export const DELIVERABLE_MAX_DEFAULT = 6;

export function DeliverableList({
  items,
  onChange,
  max = DELIVERABLE_MAX_DEFAULT,
  disabled = false,
  className,
}: Readonly<DeliverableListProps>) {
  const updateItem = (index: number, text: string): void => {
    onChange(items.map((item, i) => (i === index ? text : item)));
  };

  const removeItem = (index: number): void => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = (): void => {
    if (items.length >= max) {
      return;
    }
    onChange([...items, ""]);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {items.map((item, index) => (
        <div
          key={index}
          className="flex items-center gap-2 rounded-xl border border-border-default bg-surface-default p-2"
        >
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-muted text-xs font-bold text-text-tertiary">
            {index + 1}
          </span>
          <Input
            value={item}
            disabled={disabled}
            aria-label={`Deliverable ${index + 1}`}
            placeholder={`Deliverable ${index + 1}`}
            onChange={(event) => updateItem(index, event.target.value)}
          />
          <button
            type="button"
            aria-label={`Remove deliverable ${index + 1}`}
            disabled={disabled || items.length <= 1}
            onClick={() => removeItem(index)}
            className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-error-50 hover:text-error-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <span aria-hidden className="text-sm font-semibold leading-none">
              ×
            </span>
          </button>
        </div>
      ))}

      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={addItem}
        disabled={disabled || items.length >= max}
        className="w-full justify-center gap-1.5"
      >
        <Plus className="size-4" aria-hidden />
        Add deliverable
      </Button>
    </div>
  );
}

export default DeliverableList;