import React from "react";
import { Star } from "lucide-react";
import { cx } from "@/components/theme/utils";
import { countSizeClasses, starSizeClasses } from "./variants";

/** Star glyph size. `sm` is the 14px default used by inline cards. */
export type RatingSize = "sm" | "md" | "lg";

export interface RatingProps {
  value: number;
  max?: number;
  count?: number;
  /** Star glyph size. Defaults to `sm`. */
  size?: RatingSize;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  count,
  size = "sm",
  className,
}) => {
  const filledCount = Math.floor(value);

  return (
    <div className={cx('flex items-center gap-1', className)}>
      <div
        className="flex items-center gap-0.5"
        role="img"
        aria-label={`${value} out of ${max} stars`}
      >
        {[...Array(max)].map((_, i) => (
          <Star
            key={i}
            aria-hidden="true"
            className={cx(
              starSizeClasses[size],
              i < filledCount ? 'fill-primary-600 text-primary-600' : 'text-primary-600/20',
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className={cx('font-bold text-primary-600/60 ml-1', countSizeClasses[size])}>
          ({count})
        </span>
      )}
    </div>
  );
};

export default Rating;
