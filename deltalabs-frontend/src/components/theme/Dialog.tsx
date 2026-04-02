/** Minimal dialog primitives for modals and sheets. */
"use client";

import type { HTMLAttributes, ReactNode } from "react";

import { cx } from "@/components/theme/utils";

export type DialogOverlayProps = Readonly<
  HTMLAttributes<HTMLDivElement> & {
    onClose?: () => void;
  }
>;

export function DialogOverlay({ className, onClick, onClose, ...props }: DialogOverlayProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className={cx("fixed inset-0 z-[1300] bg-slate-950/30 backdrop-blur-[2px]", className)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented) return;
        onClose?.();
      }}
      {...props}
    />
  );
}

export type DialogPanelProps = Readonly<HTMLAttributes<HTMLDivElement>>;

export function DialogPanel({ className, ...props }: DialogPanelProps) {
  return (
    <div
      className={cx(
        "rounded-2xl border border-border-default bg-surface-default text-text-primary shadow-md",
        className,
      )}
      {...props}
    />
  );
}

export type DialogHeaderProps = Readonly<HTMLAttributes<HTMLDivElement>>;

export function DialogHeader({ className, ...props }: DialogHeaderProps) {
  return <div className={cx("border-b border-border-default bg-surface-muted/60", className)} {...props} />;
}

export type DialogSectionProps = Readonly<HTMLAttributes<HTMLDivElement> & { title?: ReactNode }>;

export function DialogSection({ className, title, children, ...props }: DialogSectionProps) {
  return (
    <div className={cx("px-2 py-2", className)} {...props}>
      {title ? (
        <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-text-secondary/70">
          {title}
        </p>
      ) : null}
      {children}
    </div>
  );
}

