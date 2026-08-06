/**
 * DistributionBar
 * Atomic Level: Molecule
 *
 * Single difficulty-distribution row for the question pool preview: a dark
 * slate pill with a colored status tag on the left, the label, and the
 * percentage right-aligned. Tone maps to a functional status color
 * (green = easy, orange = medium, red = hard).
 */

import { cn } from "@/lib/utils";

export interface DistributionBarProps {
  label: string;
  /** Percentage value rendered right-aligned, e.g. 30 → "30%". */
  percent: number;
  /** Difficulty tone → status tag color. */
  tone: "easy" | "medium" | "hard";
  className?: string;
}

const TONE_TAG_CLASSES: Record<DistributionBarProps["tone"], string> = {
  easy: "bg-success-500",
  medium: "bg-warning-500",
  hard: "bg-error-500",
};

export function DistributionBar({
  label,
  percent,
  tone,
  className,
}: Readonly<DistributionBarProps>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-lg bg-primary-700 px-4 py-2.5",
        className,
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        <span className={cn("size-3 shrink-0 rounded-sm", TONE_TAG_CLASSES[tone])} aria-hidden />
        <span className="truncate text-sm font-semibold text-white">{label}</span>
      </span>
      <span className="text-sm font-bold text-white">{percent}%</span>
    </div>
  );
}

export default DistributionBar;
