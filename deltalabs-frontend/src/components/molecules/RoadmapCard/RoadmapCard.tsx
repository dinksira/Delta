import React from 'react';
import { Typography } from '@/components/theme';
import { cx } from '@/components/theme/utils';

export interface RoadmapCardProps {
  title: string;
  description: string;
  tags: string[];
  className?: string;
}

export const RoadmapCard: React.FC<RoadmapCardProps> = ({
  title,
  description,
  tags,
  className,
}) => {
  return (
    <div className={cx(
      "w-[340px] bg-white border border-[#174A5F]/10 rounded-[24px] p-6 shadow-sm hover:shadow-md transition-shadow",
      className
    )}>
      <Typography className="text-[22px] font-bold text-[#174A5F] mb-3">
        {title}
      </Typography>
      <Typography className="text-[11px] font-medium text-[#64748B] leading-relaxed mb-6">
        {description}
      </Typography>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag, i) => (
          <div key={i} className="bg-[#F1F5F9] px-3 py-1.5 rounded-lg">
            <Typography className="text-[10px] font-bold text-[#174A5F]">
              {tag}
            </Typography>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoadmapCard;
