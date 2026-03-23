/** Shared Tailwind class maps for button-styled controls (button and link). */
import { cx } from "@/components/theme/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export const buttonVariantClasses: Readonly<Record<ButtonVariant, string>> = {
  primary:
    "text-text-inverse bg-primary-600 border border-transparent hover:bg-primary-700 focus-visible:ring-primary-300",
  secondary:
    "text-text-primary bg-surface-default border border-border-default hover:bg-primary-50 focus-visible:ring-primary-200",
  ghost:
    "text-text-secondary bg-transparent border border-transparent hover:bg-primary-50 focus-visible:ring-primary-200",
};

export const buttonSizeClasses: Readonly<Record<ButtonSize, string>> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const buttonBaseClasses =
  "inline-flex items-center justify-center gap-2 rounded-md font-medium shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  return cx(
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className,
  );
}
