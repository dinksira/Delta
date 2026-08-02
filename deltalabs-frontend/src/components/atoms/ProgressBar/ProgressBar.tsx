import React from 'react';
import { cx } from '@/components/theme/utils';

export interface ProgressBarProps {
  progress: number;
  label?: string;
  /** Overrides the default "{progress}%" caption shown on the right. */
  valueText?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  valueText,
  className,
}) => {
  return (
    <div className={cx("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-[11px] font-medium text-text-secondary">
            {label}
          </span>
        )}
        <span className="text-sm font-bold text-primary-600">
          {valueText ?? `${progress}%`}
        </span>
      </div>
      <div className="h-[5px] w-full bg-surface-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary-600 rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
