"use client";

import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/theme";

type SchoolStatePanelProps = Readonly<{
  title: string;
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  isActionDisabled?: boolean;
  onAction?: () => void;
}>;

export function SchoolStatePanel({
  title,
  message,
  icon: Icon,
  actionLabel,
  isActionDisabled = false,
  onAction,
}: SchoolStatePanelProps) {
  return (
    <div className="col-span-full flex min-h-[220px] items-center justify-center rounded-xl border border-border-default bg-surface-default px-4 py-10">
      <div className="flex max-w-xl flex-col items-center text-center">
        {Icon ? (
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-tertiary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        ) : null}
        <Typography as="h3" className="text-xl font-semibold text-text-primary">
          {title}
        </Typography>
        <Typography as="p" className="mt-2 max-w-lg text-sm leading-relaxed text-text-secondary">
          {message}
        </Typography>
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            disabled={isActionDisabled}
            className="mt-6 inline-flex h-10 items-center justify-center rounded-md border border-border-default px-5 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

