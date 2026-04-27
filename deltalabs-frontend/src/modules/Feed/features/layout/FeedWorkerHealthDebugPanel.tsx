"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useFeedWorkerHealth } from "@/modules/Feed/hooks";
import { Typography } from "@/components/theme";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Props for feed worker health debug panel. */
type FeedWorkerHealthDebugPanelProps = Readonly<{
  enabled: boolean;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Lightweight live panel to inspect feed worker lag/dead-letter growth. */
export function FeedWorkerHealthDebugPanel({ enabled }: FeedWorkerHealthDebugPanelProps) {
  const { data, isPending, isError } = useFeedWorkerHealth(enabled);
  if (!enabled) return null;

  return (
    <section className="rounded-xl border border-border-default bg-surface-default p-3">
      <Typography as="h3" variant="label" className="text-text-primary">
        Feed Worker Health
      </Typography>
      {isPending ? (
        <Typography as="p" variant="small" className="mt-2 text-text-secondary">
          Loading...
        </Typography>
      ) : null}
      {isError ? (
        <Typography as="p" variant="small" className="mt-2 text-error-500">
          Failed to load health.
        </Typography>
      ) : null}
      {data ? (
        <dl className="mt-2 grid grid-cols-1 gap-1 text-xs text-text-secondary">
          <div className="flex items-center justify-between gap-2">
            <dt>Lag approx</dt>
            <dd className="font-semibold text-text-primary">{data.lag_approx}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Dead letter</dt>
            <dd className="font-semibold text-text-primary">{data.dead_letter_length}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Stream length</dt>
            <dd className="font-semibold text-text-primary">{data.stream_length}</dd>
          </div>
          <div className="flex items-center justify-between gap-2">
            <dt>Processed total</dt>
            <dd className="font-semibold text-text-primary">{data.processed_total}</dd>
          </div>
        </dl>
      ) : null}
    </section>
  );
}
/** ################################ /COMPONENT ############################# */
