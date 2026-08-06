/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Switch aligned with `Input`/`Checkbox` tokens; role="switch" for a11y. */
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export type SwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Story label (rendered as an aria-label when provided). */
  label?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "type" | "onClick">;

export function Switch({
  checked,
  onCheckedChange,
  disabled = false,
  label,
  className,
  style,
  ...props
}: Readonly<SwitchProps>) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "inline-flex h-5 w-9 shrink-0 items-center rounded-full border px-0.5 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 focus-visible:ring-offset-2",
        checked
          ? "border-primary-700 bg-primary-700"
          : "border-border-default bg-surface-muted",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
      style={style}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          "size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0",
        )}
      />
    </button>
  );
}
/** ################################ /COMPONENT ############################# */