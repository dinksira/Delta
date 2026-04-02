import type { ReactNode } from "react";

import { cx } from "@/components/theme/utils";

type FieldProps = Readonly<{
  id: string;
  label: string;
  /** Overrides default label color/weight (e.g. auth forms use muted gray). */
  labelClassName?: string;
  /** Client-side validation message; shown right-aligned on the label row (auth pattern). */
  errorMessage?: string;
  className?: string;
  children: ReactNode;
}>;

/** Shared label + control wrapper for forms across features. */
export function Field({ id, label, labelClassName, errorMessage, className, children }: FieldProps) {
  const errorId = errorMessage ? `${id}-error` : undefined;
  const labelId = `${id}-label`;

  return (
    <div className={cx("flex flex-col gap-1.5", className)}>
      <div className="flex items-center justify-between gap-3">
        <label
          id={labelId}
          htmlFor={id}
          className={cx("min-w-0 cursor-pointer text-sm leading-snug", labelClassName ?? "font-medium text-text-primary")}
        >
          {label}
        </label>
        {errorMessage ? (
          <span id={errorId} role="alert" className="shrink-0 text-right text-sm font-normal text-error-500">
            {errorMessage}
          </span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
