import React from 'react';
import { Search } from 'lucide-react';
import { Typography } from '@/components/theme';
import { RoadmapSummaryCard, RoadmapSummaryCardProps } from '@/components/molecules/RoadmapSummaryCard';

export const RoadmapCommunityView: React.FC = () => {
  const mockRoadmaps: RoadmapSummaryCardProps[] = [
    {
      id: 'c1',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa Uni',
      institutionLogo: '/school/AAU_Logo.png',
      rating: 1,
    },
    {
      id: 'c2',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      isAiGenerated: true,
      rating: 1,
    },
    {
      id: 'c3',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa Uni',
      institutionLogo: '/school/AAU_Logo.png',
      rating: 1,
    },
    {
      id: 'c4',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa Uni',
      institutionLogo: '/school/AAU_Logo.png',
      rating: 1,
    }
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography className="text-[28px] font-bold text-[#174A5F]">
          Community
        </Typography>
      </div>

      {/* Search Bar */}
      <div className="flex justify-start pt-2">
        <div className="w-full max-w-[520px] h-12 bg-white border border-[#174A5F]/10 rounded-xl flex items-center overflow-hidden focus-within:border-[#174A5F]/30 transition-all shadow-sm">
          <div className="px-4">
            <Search className="h-5 w-5 text-[#174A5F]/40" />
          </div>
          <input 
            type="text" 
            placeholder="Search" 
            className="flex-1 h-full bg-transparent outline-none text-[15px] text-[#174A5F] placeholder:text-[#174A5F]/30"
          />
        </div>
      </div>

      {/* Grid of Roadmap Summaries */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 py-4">
        {mockRoadmaps.map((roadmap) => (
          <RoadmapSummaryCard
            key={roadmap.id}
            {...roadmap}
            onAction={() => console.log('View roadmap', roadmap.id)}
          />
        ))}
      </div>
    </div>
  );
};

export default RoadmapCommunityView;
