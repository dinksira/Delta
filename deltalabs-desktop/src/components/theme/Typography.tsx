/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Shared typography primitive for semantic text rendering. */
import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "@/components/theme/utils";

type TypographyVariant = "h1" | "h2" | "h3" | "body" | "small" | "label";
type TypographyElement = "h1" | "h2" | "h3" | "p" | "span" | "label";

const variantClasses: Readonly<Record<TypographyVariant, string>> = {
  h1: "text-3xl font-bold text-text-primary leading-tight",
  h2: "text-2xl font-semibold text-text-primary leading-tight",
  h3: "text-xl font-semibold text-text-primary leading-tight",
  body: "text-base font-normal text-text-primary leading-normal",
  small: "text-sm font-normal text-text-secondary leading-normal",
  label: "text-sm font-medium text-text-primary leading-normal",
};

export interface TypographyProps extends HTMLAttributes<HTMLElement> {
  as?: TypographyElement;
  variant?: TypographyVariant;
  children: ReactNode;
}

export function Typography({
  as = "p",
  variant = "body",
  className,
  children,
  ...props
}: Readonly<TypographyProps>) {
  const Component = as;
  return (
    <Component className={cx(variantClasses[variant], className)} {...props}>
      {children}
    </Component>
  );
}
/** ################################ /COMPONENT ############################# */
