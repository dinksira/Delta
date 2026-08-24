/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Shared button primitive for Delta Labs UI. */
import type { ButtonHTMLAttributes, Ref } from "react";

import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClassName,
} from "@/components/theme/buttonStyles";

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  ref?: Ref<HTMLButtonElement>;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ref,
  ...props
}: Readonly<ButtonProps>) {
  return (
    <button
      ref={ref}
      type={type}
      className={cxButtonDisabled(getButtonClassName(variant, size, className))}
      {...props}
    />
  );
}

function cxButtonDisabled(classes: string): string {
  return `${classes} disabled:cursor-not-allowed disabled:opacity-60`;
}
/** ################################ /COMPONENT ############################# */
