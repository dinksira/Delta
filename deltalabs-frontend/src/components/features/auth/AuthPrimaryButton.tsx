/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ButtonHTMLAttributes } from "react";

import {
  type AuthPrimaryButtonVariant,
  getAuthPrimaryButtonClassName,
} from "@/components/features/auth/authPrimaryButtonStyles";
import type { ButtonSize } from "@/components/theme/buttonStyles";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
export type { AuthPrimaryButtonVariant };

export type AuthPrimaryButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    primaryVariant?: AuthPrimaryButtonVariant;
    size?: ButtonSize;
  }
>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AuthPrimaryButton({
  primaryVariant = "solid",
  size = "lg",
  className,
  type = "submit",
  ...props
}: AuthPrimaryButtonProps) {
  return (
    <button
      type={type}
      className={getAuthPrimaryButtonClassName(primaryVariant, size, className)}
      {...props}
    />
  );
}
/** ################################ /COMPONENT ############################# */
