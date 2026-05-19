import React from 'react';
import RoadmapCard, { RoadmapCardProps } from '@/components/molecules/RoadmapCard';
import { cx } from '@/components/theme/utils';

export interface RoadmapStep extends RoadmapCardProps {
  id: string;
  isCompleted?: boolean;
}

export interface RoadmapTimelineProps {
  steps: RoadmapStep[];
}

export const RoadmapTimeline: React.FC<RoadmapTimelineProps> = ({ steps }) => {
  return (
    <div className="relative flex flex-col items-center py-10 w-full min-h-screen">
      {/* Central Line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[5px] bg-[#F1F5F9] -translate-x-1/2" />

      {/* Progress Line (Overlay) */}
      <div 
        className="absolute left-1/2 top-0 w-[5px] bg-[#4ADE80] -translate-x-1/2 rounded-full transition-all duration-1000"
        style={{ height: '50%' }} // Mock 50% completion
      />

      {/* Steps */}
      <div className="relative w-full space-y-24">
        {steps.map((step, index) => {
          const isLeft = index % 2 === 0;

          return (
            <div key={step.id} className="relative flex items-center justify-center w-full">
              {/* Dot on line */}
              <div className={cx(
                "absolute left-1/2 -translate-x-1/2 w-10 h-10 rounded-full z-10 border-[6px] border-white shadow-sm transition-colors duration-500",
                step.isCompleted ? "bg-[#1C9E45]" : "bg-[#174A5F]"
              )} />

              {/* Connecting Line (Horizontal) */}
              <div className={cx(
                "absolute top-1/2 -translate-y-1/2 w-[80px] h-[3px] transition-colors duration-500",
                step.isCompleted ? "bg-[#4ADE80]" : "bg-[#174A5F]/20",
                isLeft ? "right-[50%] mr-4" : "left-[50%] ml-4"
              )} />

              {/* Card Container */}
              <div className={cx(
                "w-full flex px-4",
                isLeft ? "justify-end pr-[50%] mr-20" : "justify-start pl-[50%] ml-20"
              )}>
                <RoadmapCard {...step} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoadmapTimeline;
