import React from 'react';
import Image from 'next/image';
import { Share2, Sun, ChevronRight, Sparkles } from 'lucide-react';
import { Typography } from '@/components/theme';
import Rating from '@/components/atoms/Rating';
import Badge from '@/components/atoms/Badge';

export interface RoadmapSummaryCardProps {
  id: string;
  title: string;
  description: string;
  institutionName?: string;
  institutionLogo?: string;
  isAiGenerated?: boolean;
  isSuper?: boolean;
  rating: number;
  buttonLabel?: string;
  onAction?: () => void;
}

export const RoadmapSummaryCard: React.FC<RoadmapSummaryCardProps> = ({
  title,
  description,
  institutionName,
  institutionLogo,
  isAiGenerated,
  isSuper,
  rating,
  buttonLabel = 'View roadmap',
  onAction,
}) => {
  return (
    <div className="w-full max-w-[580px] bg-[#F1F5F9]/50 border border-[#174A5F]/5 rounded-[24px] p-8 flex flex-col relative group hover:bg-[#F1F5F9] transition-all">
      {/* Top Right Icon */}
      <div className="absolute top-6 right-6 text-[#174A5F]/40">
        <Sun className="h-6 w-6" />
      </div>

      <div className="flex justify-between items-start mb-4">
        <div className="space-y-1">
          <Typography className="text-xl font-bold text-[#174A5F]">
            {title}
          </Typography>
          <Typography className="text-[13px] font-medium text-[#64748B]">
            {description}
          </Typography>
        </div>

        {/* Institution / AI Indicator */}
        <div className="flex items-center gap-3">
          {isAiGenerated ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white border border-[#174A5F]/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#174A5F]" />
              </div>
              <Typography className="text-[11px] font-bold text-[#174A5F]">AI Generated</Typography>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-right">
              <div className="flex flex-col">
                <Typography className="text-[10px] font-bold text-[#174A5F]">{institutionName}</Typography>
                <Typography className="text-[9px] font-medium text-[#64748B]">physics dep</Typography>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-[#174A5F]/10 overflow-hidden relative">
                {institutionLogo ? (
                  <Image src={institutionLogo} alt={institutionName || ''} fill className="object-contain p-1" />
                ) : (
                  <div className="w-full h-full bg-[#174A5F]/5" />
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Convert Link / Badge */}
      <div className="mb-6">
        {isSuper ? (
          <Badge variant="warning">Super roadmap</Badge>
        ) : (
          <button className="flex items-center gap-2 text-[#174A5F] hover:underline">
            <Share2 className="h-4 w-4" />
            <Typography className="text-[11px] font-bold">Convert to Super</Typography>
          </button>
        )}
      </div>

      <div className="flex items-end justify-between gap-8">
        {/* Roadmap Preview (SVG illustration) */}
        <div className="flex-1 h-24 relative opacity-80 group-hover:opacity-100 transition-opacity">
          <svg viewBox="0 0 400 100" className="w-full h-full">
            {/* Wave line */}
            <path d="M0,50 Q50,30 100,50 T200,50 T300,50 T400,50" fill="none" stroke="#174A5F" strokeWidth="2" strokeDasharray="4 4" className="opacity-20" />
            {/* Dots and cards mini-representation */}
            {[20, 60, 100, 140, 180, 220, 260, 300, 340].map((x, i) => (
              <g key={i}>
                <circle cx={x} cy={50} r="3" fill="#174A5F" className="opacity-40" />
                <rect x={x-8} y={i % 2 === 0 ? 15 : 65} width="16" height="20" rx="4" fill={['#EF4444', '#10B981', '#6366F1', '#F59E0B'][i % 4]} className="opacity-80" />
              </g>
            ))}
          </svg>
        </div>

        {/* Rating & Action */}
        <div className="flex flex-col gap-4 min-w-[140px]">
          <div className="space-y-1">
            <Typography className="text-[11px] font-bold text-[#174A5F]">Rating</Typography>
            <Rating value={rating} />
          </div>

          <button 
            onClick={onAction}
            className="w-full h-11 bg-[#174A5F] text-white rounded-lg flex items-center justify-between px-6 hover:bg-[#133e50] transition-colors group/btn"
          >
            <span className="text-[13px] font-bold">{buttonLabel}</span>
            <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoadmapSummaryCard;
