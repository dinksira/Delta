/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Shared card primitives for Delta Labs UI. */
import type { HTMLAttributes } from "react";

import { cx } from "@/components/theme/utils";

export type CardProps = HTMLAttributes<HTMLDivElement>;

export function Card({ className, ...props }: Readonly<CardProps>) {
  return (
    <div
      className={cx(
        "flex flex-col gap-4 p-5 bg-surface-default border border-border-default rounded-lg shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export type CardHeaderProps = HTMLAttributes<HTMLDivElement>;

export function CardHeader({ className, ...props }: Readonly<CardHeaderProps>) {
  return <div className={cx("flex flex-col gap-1", className)} {...props} />;
}

export type CardTitleProps = HTMLAttributes<HTMLHeadingElement>;

export function CardTitle({ className, ...props }: Readonly<CardTitleProps>) {
  return <h3 className={cx("text-lg font-semibold text-text-primary", className)} {...props} />;
}

export type CardDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

export function CardDescription({ className, ...props }: Readonly<CardDescriptionProps>) {
  return <p className={cx("text-sm text-text-secondary", className)} {...props} />;
}

export type CardContentProps = HTMLAttributes<HTMLDivElement>;

export function CardContent({ className, ...props }: Readonly<CardContentProps>) {
  return <div className={cx("text-sm text-text-primary", className)} {...props} />;
}

export type CardFooterProps = HTMLAttributes<HTMLDivElement>;

export function CardFooter({ className, ...props }: Readonly<CardFooterProps>) {
  return <div className={cx("flex items-center gap-3 pt-1", className)} {...props} />;
}
/** ################################ /COMPONENT ############################# */
