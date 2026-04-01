/** Standardized primary CTA styles for auth flows (`AuthPrimaryButton`). */
import { cx } from "@/components/theme/utils";

import { type ButtonSize } from "@/components/theme/buttonStyles";

export type AuthPrimaryButtonVariant = "solid" | "outline" | "soft";

const authPrimaryVariantClasses: Readonly<Record<AuthPrimaryButtonVariant, string>> = {
  solid:
    "border border-transparent bg-primary-600 text-text-inverse shadow-sm hover:bg-primary-700 focus-visible:ring-primary-400",
  outline:
    "border-2 border-primary-600 bg-transparent text-primary-700 shadow-sm hover:bg-primary-50 focus-visible:ring-primary-300",
  soft: "border border-transparent bg-primary-100 text-primary-900 shadow-sm hover:bg-primary-200 focus-visible:ring-primary-300",
};

const authPrimaryBaseClasses =
  "inline-flex w-full items-center justify-center gap-2 rounded-md font-bold transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-auth-modal-surface disabled:cursor-not-allowed disabled:opacity-60";

const authPrimarySizeClasses: Readonly<Record<ButtonSize, string>> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-5 text-base",
};

export function getAuthPrimaryButtonClassName(
  variant: AuthPrimaryButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cx(authPrimaryBaseClasses, authPrimaryVariantClasses[variant], authPrimarySizeClasses[size], className);
}
