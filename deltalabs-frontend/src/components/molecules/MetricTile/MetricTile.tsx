/**
 * MetricTile — a labeled numeric stat tile (SCORE / RANK / CORRECT) for the
 * duel quiz metrics row. Icon-led, mirrors StatCard but compact and centered.
 *
 * @example
 * ```tsx
 * <MetricTile label="SCORE" value="1,200" icon={<Trophy />} tone="primary" />
 * ```
 */

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type MetricTileTone = "primary" | "success" | "info";

export interface MetricTileProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: MetricTileTone;
  className?: string;
}

const toneIconClasses: Record<MetricTileTone, string> = {
  primary: "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  success: "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  info: "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300",
};

export function MetricTile({
  label,
  value,
  icon,
  tone = "primary",
  className,
}: Readonly<MetricTileProps>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1.5 rounded-xl border border-border-default bg-surface-default px-3 py-3",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-lg",
            toneIconClasses[tone],
          )}
          aria-hidden
        >
          {icon}
        </div>
      )}
      <p className="text-lg font-bold leading-tight text-text-primary">{value}</p>
      <p className="text-[10px] font-medium uppercase tracking-wide text-text-secondary">
        {label}
      </p>
    </div>
  );
}

export default MetricTile;
