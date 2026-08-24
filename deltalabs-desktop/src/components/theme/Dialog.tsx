/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
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

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  children: ReactNode;
  className?: string;
}

export function Dialog({ isOpen, onClose, title, size = "md", children, className }: DialogProps) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
  };

  return (
    <DialogOverlay onClose={onClose} className="flex items-center justify-center p-4">
      <DialogPanel
        className={cx(
          "w-full overflow-hidden shadow-xl transform transition-all duration-300 ease-out animate-in fade-in zoom-in-95",
          sizeClasses[size],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <DialogHeader className="px-6 py-4 flex items-center justify-between border-b border-border-default">
            <h3 className="text-lg font-semibold text-text-primary">{title}</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary p-1 rounded-lg hover:bg-surface-muted transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </DialogHeader>
        ) : null}
        <div>{children}</div>
      </DialogPanel>
    </DialogOverlay>
  );
}

/** ################################ /COMPONENT ############################# */
