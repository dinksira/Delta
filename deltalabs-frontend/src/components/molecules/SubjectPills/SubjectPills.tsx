import React from "react";
import { cn } from "@/lib/utils";

export interface SubjectPill {
  value: string;
  label: string;
  count: number;
}

export interface SubjectPillsProps {
  /** Pills to render, in display order. */
  subjects: SubjectPill[];
  /** Currently active pill value. */
  activeValue: string;
  /** Callback fired when a pill is selected. */
  onChange: (value: string) => void;
  /** Toggle the per-pill `(count)` badge (defaults to `true`). */
  showCount?: boolean;
  /** Pill density: `"default"` (h-10) or `"compact"` (slimmer, spec trending pills). */
  density?: "default" | "compact";
  /** Accessible label for the scrollable group. */
  ariaLabel?: string;
  className?: string;
}

/**
 * SubjectPills
 * Molecule: horizontally scrollable outline pill group with per-subject counts.
 * Active pill gets a filled primary treatment + bold label.
 */
export const SubjectPills: React.FC<SubjectPillsProps> = ({
  subjects,
  activeValue,
  onChange,
  showCount = true,
  density = "default",
  ariaLabel = "Filter by subject",
  className,
}) => {
  return (
    <div
      className={cn(
        "w-full shrink-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        density === "default" ? "h-10" : "h-9",
        className,
      )}
    >
      <div className="flex h-full w-max items-center gap-2" role="tablist" aria-label={ariaLabel}>
        {subjects.map((subject) => {
          const active = subject.value === activeValue;
          return (
            <button
              key={subject.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(subject.value)}
              className={cn(
                "inline-flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border transition-colors",
                density === "default" ? "px-4 py-2 text-sm" : "px-5 text-[13px]",
                active
                  ? cn(
                      "font-semibold text-white",
                      density === "default"
                        ? "border-primary-600 bg-primary-600"
                        : "border-primary-700 bg-primary-700",
                    )
                  : cn(
                      "bg-surface-default font-medium hover:text-text-primary",
                      density === "default"
                        ? "border-border-default text-text-secondary hover:border-primary-300"
                        : "border-text-tertiary text-text-secondary hover:border-primary-300",
                    ),
              )}
            >
              {subject.label}
              {showCount && (
                <span
                  className={cn(
                    "text-xs tabular-nums",
                    active ? "text-white/80" : "text-text-tertiary",
                  )}
                >
                  ({subject.count})
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectPills;
