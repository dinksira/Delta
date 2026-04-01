import type { SelectHTMLAttributes } from "react";

import { cx } from "@/components/theme/utils";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

/** Shared select primitive for Delta Labs UI. */
export function Select({ className, ...props }: Readonly<SelectProps>) {
  return (
    <select
      className={cx(
        "w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition-colors duration-150",
        "cursor-pointer placeholder:text-text-secondary focus:border-primary-400 focus:ring-2 focus:ring-primary-200",
        "disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
