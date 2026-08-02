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
  ariaLabel = "Filter by subject",
  className,
}) => {
  return (
    <div
      className={cn(
        "h-10 w-full shrink-0 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
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
                "inline-flex h-full shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-4 py-2 text-sm transition-colors",
                active
                  ? "border-primary-600 bg-primary-600 font-semibold text-white"
                  : "border-border-default bg-surface-default font-medium text-text-secondary hover:border-primary-300 hover:text-text-primary",
              )}
            >
              {subject.label}
              <span
                className={cn(
                  "text-xs tabular-nums",
                  active ? "text-white/80" : "text-text-tertiary",
                )}
              >
                ({subject.count})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SubjectPills;
