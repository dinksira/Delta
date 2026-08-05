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
  primary: "bg-primary-600 text-white",
  success: "bg-success-600 text-white",
  info: "bg-info-600 text-white",
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
