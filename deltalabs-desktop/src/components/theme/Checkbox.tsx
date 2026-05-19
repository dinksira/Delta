/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Checkbox aligned with `Input` border/focus tokens. */
import type { InputHTMLAttributes } from "react";

import { cx } from "@/components/theme/utils";

export type CheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type">;

export function Checkbox({ className, ...props }: Readonly<CheckboxProps>) {
  return (
    <input
      type="checkbox"
      className={cx(
        "size-4 shrink-0 rounded border border-border-default bg-surface-default text-primary-600 accent-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
/** ################################ /COMPONENT ############################# */
