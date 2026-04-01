/** Tailwind class maps for auth form controls (aligned to `auth.input.*` tokens). */
import { cx } from "@/components/theme/utils";

export function getAuthInputClassName(options?: Readonly<{ error?: boolean; className?: string }>): string {
  const { error, className } = options ?? {};
  return cx(
    "w-full rounded-xl border px-4 py-3 text-base shadow-sm outline-none transition-colors duration-150",
    "bg-auth-input-bg text-text-primary placeholder:text-auth-input-placeholder",
    "disabled:cursor-not-allowed disabled:opacity-60",
    error
      ? "border-auth-input-border-error focus:border-auth-input-border-error focus:ring-2 focus:ring-error-500/25"
      : "border-auth-input-border focus:border-auth-input-border-focus focus:ring-2 focus:ring-primary-200",
    className,
  );
}
