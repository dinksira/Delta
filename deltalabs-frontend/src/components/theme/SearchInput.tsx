import type { InputHTMLAttributes, ReactNode } from "react";

import { cx } from "@/components/theme/utils";

function IconSearch({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx={8.5} cy={8.5} r={5.25} stroke="currentColor" strokeWidth={1.5} />
      <path d="M12.2 12.2 16.25 16.25" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export type SearchInputProps = Readonly<{
  id?: string;
  placeholder?: string;
  /** Leading control inside the pill (e.g. filter trigger). */
  startSlot?: ReactNode;
  className?: string;
  inputClassName?: string;
}> &
  Omit<InputHTMLAttributes<HTMLInputElement>, "className" | "type">;

/** Figma-style pill search: optional start slot, field, magnifier. */
export function SearchInput({
  id,
  placeholder = "Search...",
  startSlot,
  className,
  inputClassName,
  ...inputProps
}: SearchInputProps) {
  return (
    <div
      className={cx(
        "flex h-11 w-full max-w-full items-center gap-2 rounded-full border border-border-default bg-surface-default px-2.5 py-1 shadow-sm",
        className,
      )}
    >
      {startSlot}
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        className={cx(
          "min-w-0 flex-1 border-0 bg-transparent py-1.5 text-sm text-text-primary outline-none placeholder:text-text-secondary",
          inputClassName,
        )}
        {...inputProps}
      />
      <span className="inline-flex shrink-0 items-center justify-center p-1 text-slate-600 dark:text-slate-300">
        <IconSearch className="shrink-0" />
      </span>
    </div>
  );
}
