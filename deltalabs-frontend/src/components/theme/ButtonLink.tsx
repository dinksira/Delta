/** Anchor styled as a theme button for Next.js navigation. */
import Link from "next/link";
import type { ComponentProps } from "react";

import {
  type ButtonSize,
  type ButtonVariant,
  getButtonClassName,
} from "@/components/theme/buttonStyles";

export interface ButtonLinkProps extends ComponentProps<typeof Link> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function ButtonLink({
  className,
  variant = "primary",
  size = "md",
  ...props
}: Readonly<ButtonLinkProps>) {
  return <Link className={getButtonClassName(variant, size, className)} {...props} />;
}
