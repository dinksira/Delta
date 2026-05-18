import React from 'react';
import { Search, SlidersHorizontal, Sparkles } from 'lucide-react';
import { Typography } from '@/components/theme';
import { RoadmapSummaryCard, RoadmapSummaryCardProps } from '@/components/molecules/RoadmapSummaryCard';
import { cx } from '@/components/theme/utils';

export interface RoadmapPersonalViewProps {
  // Add props if needed
}

export const RoadmapPersonalView: React.FC<RoadmapPersonalViewProps> = () => {
  const [activeTab, setActiveTab] = React.useState<'personal' | 'draft'>('personal');

  const mockRoadmaps: RoadmapSummaryCardProps[] = [
    {
      id: '1',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa Uni',
      institutionLogo: '/school/AAU_Logo.png',
      rating: 1,
    },
    {
      id: '2',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      isAiGenerated: true,
      rating: 1,
    },
    {
      id: '3',
      title: 'Physics super',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa & Haramaya',
      institutionLogo: '/school/AAU_Logo.png',
      isSuper: true,
      rating: 1,
    }
  ];

  const draftRoadmaps: RoadmapSummaryCardProps[] = [
    {
      id: 'd1',
      title: 'Physics',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa Uni',
      institutionLogo: '/school/AAU_Logo.png',
      rating: 1,
      buttonLabel: 'Continue'
    }
  ];

  const displayRoadmaps = activeTab === 'personal' ? mockRoadmaps : draftRoadmaps;

  return (
    <div className="space-y-10">
      {/* Header with Tabs and AI Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-12">
          {[
            { id: 'personal', label: 'Personal' },
            { id: 'draft', label: 'Draft' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cx(
                "text-[28px] font-bold transition-all relative",
                activeTab === tab.id ? "text-[#174A5F]" : "text-[#174A5F]/30 hover:text-[#174A5F]/60"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button className="h-[44px] px-8 bg-[#174A5F] rounded-lg text-white font-bold text-[13px] hover:bg-[#133e50] transition-all shadow-lg">
          AI Generate
        </button>
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
        {displayRoadmaps.map((roadmap) => (
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

export default RoadmapPersonalView;
