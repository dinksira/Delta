"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { LucideIcon } from "lucide-react";

import { Typography } from "@/components/features/feed/primitives";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for standardized feed empty/error/info surfaces. */
type FeedStatePanelProps = Readonly<{
  title: string;
  message: string;
  icon?: LucideIcon;
  actionLabel?: string;
  isActionDisabled?: boolean;
  onAction?: () => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Shared feed status panel used for empty, error, and similar non-feed states. */
export function FeedStatePanel({
  title,
  message,
  icon: Icon,
  actionLabel,
  isActionDisabled = false,
  onAction,
}: FeedStatePanelProps) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-4 py-10">
      <div className="flex max-w-xl flex-col items-center text-center">
        {Icon ? (
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-surface-muted text-text-tertiary">
            <Icon className="h-7 w-7" aria-hidden="true" />
          </div>
        ) : null}
        <Typography as="h2" variant="h2" className="text-2xl font-semibold tracking-tight text-text-primary">
          {title}
        </Typography>
        <Typography as="p" variant="body" className="mt-2 max-w-lg text-base leading-relaxed text-text-secondary">
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
/** ################################ /COMPONENT ############################# */
