/** Tailwind class maps for auth form controls (aligned to `auth.input.*` tokens). */
import { cx } from "@/components/theme/utils";

export function getAuthInputClassName(
  options?: Readonly<{ error?: boolean; className?: string; trailingControl?: boolean }>,
): string {
  const { error, className, trailingControl } = options ?? {};
  return cx(
    "h-11 w-full rounded-md border py-2 text-sm shadow-none outline-none transition-[border-color,box-shadow] duration-150",
    trailingControl ? "pl-3 pr-10" : "px-3",
    "bg-auth-input-bg text-text-primary placeholder:text-auth-input-placeholder",
    "disabled:cursor-not-allowed disabled:opacity-60",
    error
      ? "!border-auth-input-border-error focus:!border-auth-input-border-error focus:ring-2 focus:!ring-error-500/25"
      : "!border-auth-input-border focus:!border-auth-input-border-focus focus:ring-2 focus:ring-primary-200",
    className,
  );
}
