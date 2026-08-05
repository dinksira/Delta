/**
 * DifficultyComposer
 * Atomic Level: Organism
 *
 * Easy / Medium / Hard percentage sliders for the Create Topic Battle wizard
 * (question pool step). Values always sum to 100: changing one slider
 * redistributes the remainder across the other two proportionally.
 */

import { cn } from "@/lib/utils";
import { Typography } from "@/components/theme/Typography";

export interface DifficultyComposerProps {
  easyPct: number;
  mediumPct: number;
  hardPct: number;
  onChange: (easy: number, medium: number, hard: number) => void;
  className?: string;
}

interface SliderSpec {
  key: "easy" | "medium" | "hard";
  label: string;
  badgeClass: string;
}

const SLIDERS: SliderSpec[] = [
  { key: "easy", label: "Easy", badgeClass: "bg-success-100 text-success-700" },
  { key: "medium", label: "Medium", badgeClass: "bg-primary-100 text-primary-700" },
  { key: "hard", label: "Hard", badgeClass: "bg-error-50 text-error-600" },
];

/** Redistribute `nextValue` to `key` and rebalance the two others proportionally. */
function rebalance(
  current: [number, number, number],
  key: "easy" | "medium" | "hard",
  nextValue: number,
): [number, number, number] {
  const index = key === "easy" ? 0 : key === "medium" ? 1 : 2;
  const clamped = Math.min(100, Math.max(0, Math.round(nextValue)));
  const next = [...current] as [number, number, number];
  next[index] = clamped;
  const others = [0, 1, 2].filter((i) => i !== index);
  const remaining = 100 - clamped;
  const total = others.reduce((sum, i) => sum + (next[i] || 0), 0);
  if (total === 0) {
    next[others[0]] = Math.round(remaining / 2);
    next[others[1]] = remaining - next[others[0]];
  } else {
    const first = Math.round(remaining * (next[others[0]] / total));
    next[others[0]] = first;
    next[others[1]] = remaining - first;
  }
  return next;
}

export function DifficultyComposer({
  easyPct,
  mediumPct,
  hardPct,
  onChange,
  className,
}: Readonly<DifficultyComposerProps>) {
  const values: Record<SliderSpec["key"], number> = { easy: easyPct, medium: mediumPct, hard: hardPct };
  const total = easyPct + mediumPct + hardPct;

  const handleChange = (key: SliderSpec["key"], value: number) => {
    const [easy, medium, hard] = rebalance([easyPct, mediumPct, hardPct], key, value);
    onChange(easy, medium, hard);
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-5 rounded-2xl border border-border-default bg-surface-default p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <Typography as="h3" className="text-sm font-bold text-primary-700">
          Difficulty Mix
        </Typography>
        <span
          className={cn(
            "rounded-full px-2.5 py-0.5 text-xs font-semibold",
            total === 100 ? "bg-success-100 text-success-700" : "bg-warning-100 text-warning-600",
          )}
        >
          {total}%
        </span>
      </div>

      {SLIDERS.map((slider) => (
        <label key={slider.key} className="flex flex-col gap-2">
          <span className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-sm font-medium text-text-primary">
              {slider.label}
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", slider.badgeClass)}>
                {values[slider.key]}%
              </span>
            </span>
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={values[slider.key]}
            onChange={(event) => handleChange(slider.key, Number(event.target.value))}
            aria-label={`${slider.label} percentage`}
            className="h-2 w-full cursor-pointer appearance-none rounded-full bg-surface-muted accent-primary-600"
          />
        </label>
      ))}

      <p className="text-xs text-text-secondary">
        Percentages always add up to 100%. Adjusting one slider rebalances the others.
      </p>
    </div>
  );
}

export default DifficultyComposer;
