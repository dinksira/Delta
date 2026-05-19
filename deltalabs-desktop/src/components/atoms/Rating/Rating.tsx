import React from 'react';
import { Star } from 'lucide-react';
import { cx } from '@/components/theme/utils';

export interface RatingProps {
  value: number;
  max?: number;
  count?: number;
  className?: string;
}

export const Rating: React.FC<RatingProps> = ({
  value,
  max = 5,
  count,
  className,
}) => {
  return (
    <div className={cx('flex items-center gap-1', className)}>
      <div className="flex items-center gap-0.5">
        {[...Array(max)].map((_, i) => (
          <Star
            key={i}
            className={cx(
              'h-3.5 w-3.5',
              i < Math.floor(value)
                ? 'fill-[#174A5F] text-[#174A5F]'
                : 'text-[#174A5F]/20'
            )}
          />
        ))}
      </div>
      {count !== undefined && (
        <span className="text-xs font-bold text-[#174A5F]/60 ml-1">({count})</span>
      )}
    </div>
  );
};

export default Rating;
