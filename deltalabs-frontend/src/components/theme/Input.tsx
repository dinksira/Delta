/** Shared input primitive for Delta Labs UI. */
import type { InputHTMLAttributes } from "react";

import { cx } from "@/components/theme/utils";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = "text", ...props }: Readonly<InputProps>) {
  return (
    <input
      type={type}
      className={cx(
        "w-full px-3 py-2 text-sm text-text-primary bg-surface-default border border-border-default rounded-md shadow-sm outline-none transition-colors duration-150 placeholder:text-text-secondary focus:border-primary-400 focus:ring-2 focus:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-60",
        className,
      )}
      {...props}
    />
  );
}
