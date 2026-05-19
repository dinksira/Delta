import React from 'react';
import { cx } from '@/components/theme/utils';

export interface ProgressBarProps {
  progress: number;
  label?: string;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  label,
  className,
}) => {
  return (
    <div className={cx("w-full space-y-2", className)}>
      <div className="flex items-center justify-between">
        {label && (
          <span className="text-[11px] font-medium text-[#64748B]">
            {label}
          </span>
        )}
        <span className="text-sm font-bold text-[#174A5F]">
          {progress}%
        </span>
      </div>
      <div className="h-[5px] w-full bg-[#F1F5F9] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#174A5F] rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
