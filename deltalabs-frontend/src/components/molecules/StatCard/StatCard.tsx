import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatCardTone = "primary" | "success" | "warning" | "info";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  tone?: StatCardTone;
  className?: string;
}

const toneIconClasses: Record<StatCardTone, string> = {
  primary:
    "bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300",
  success:
    "bg-success-100 text-success-700 dark:bg-success-900/40 dark:text-success-300",
  warning:
    "bg-warning-100 text-warning-700 dark:bg-warning-900/40 dark:text-warning-300",
  info: "bg-info-100 text-info-700 dark:bg-info-900/40 dark:text-info-300",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "primary",
  className,
}: Readonly<StatCardProps>) {
  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-2xl border border-border-default bg-surface-default p-4",
        className,
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex size-11 shrink-0 items-center justify-center rounded-xl",
            toneIconClasses[tone],
          )}
        >
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-2xl font-semibold leading-tight text-text-primary">
          {value}
        </p>
        <p className="mt-0.5 truncate text-sm text-text-secondary">{label}</p>
      </div>
    </div>
  );
}
