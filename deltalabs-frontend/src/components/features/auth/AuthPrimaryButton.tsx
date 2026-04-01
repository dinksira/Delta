import type { ButtonHTMLAttributes } from "react";

import {
  type AuthPrimaryButtonVariant,
  getAuthPrimaryButtonClassName,
} from "@/components/features/auth/authPrimaryButtonStyles";
import type { ButtonSize } from "@/components/theme/buttonStyles";

export type { AuthPrimaryButtonVariant };

export type AuthPrimaryButtonProps = Readonly<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    primaryVariant?: AuthPrimaryButtonVariant;
    size?: ButtonSize;
  }
>;

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
