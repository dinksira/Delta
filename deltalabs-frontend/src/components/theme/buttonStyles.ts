/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Shared Tailwind class maps for button-styled controls (button and link). */
import { cx } from "@/components/theme/utils";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "outlineInverse";
export type ButtonSize = "sm" | "md" | "lg";

export const buttonVariantClasses: Readonly<Record<ButtonVariant, string>> = {
  primary:
    "text-text-inverse bg-primary-600 border border-transparent hover:bg-primary-700 focus-visible:ring-primary-300",
  secondary:
    "text-text-primary bg-surface-default border border-border-default hover:bg-primary-50 focus-visible:ring-primary-200",
  ghost:
    "text-text-secondary bg-transparent border border-transparent hover:bg-primary-50 focus-visible:ring-primary-200",
  /** Teal header rail: bordered pill; label stays one line; width follows text. */
  outlineInverse:
    "h-10 rounded-full border border-white bg-transparent px-5 text-[15px] font-medium text-white hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-offset-0 sm:px-6 sm:text-base",
};

export const buttonSizeClasses: Readonly<Record<ButtonSize, string>> = {
  sm: "h-9 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-11 px-5 text-base",
};

const buttonBaseClasses =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium shadow-sm transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

const outlineInverseBaseClasses =
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

export function getButtonClassName(
  variant: ButtonVariant,
  size: ButtonSize,
  className?: string,
): string {
  if (variant === "outlineInverse") {
    return cx(outlineInverseBaseClasses, buttonVariantClasses.outlineInverse, className);
  }
  return cx(
    buttonBaseClasses,
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className,
  );
}
/** ################################ /COMPONENT ############################# */
