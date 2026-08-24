"use client";

import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { Typography } from '@/components/theme';
import { RoadmapSummaryCard, RoadmapSummaryCardProps } from '@/components/molecules/RoadmapSummaryCard';
import { SuperRoadmapSetupModal } from '../components/roadmap/molecules/SuperRoadmapSetupModal';

export const RoadmapSuperView: React.FC = () => {
  const [isSuperModalOpen, setIsSuperModalOpen] = useState(false);

  const mockRoadmaps: RoadmapSummaryCardProps[] = [
    {
      id: 's1',
      title: 'Physics super',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa & Haramaya',
      institutionLogo: '/school/AAU_Logo.png',
      isSuper: true,
      rating: 1,
    },
    {
      id: 's2',
      title: 'Physics super',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa & Haramaya',
      institutionLogo: '/school/AAU_Logo.png',
      isSuper: true,
      rating: 1,
    },
    {
      id: 's3',
      title: 'Physics super',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa & Haramaya',
      institutionLogo: '/school/AAU_Logo.png',
      isSuper: true,
      rating: 1,
    },
    {
      id: 's4',
      title: 'Physics super',
      description: 'All encompassing physics course roadmap.',
      institutionName: 'Addis Ababa & Haramaya',
      institutionLogo: '/school/AAU_Logo.png',
      isSuper: true,
      rating: 1,
    }
  ];

  const handleSuperRoadmapDone = (title: string, visibility: 'private' | 'public') => {
    console.log('Created super roadmap:', { title, visibility });
    setIsSuperModalOpen(false);
  };

  return (
    <div className="space-y-10">
      <SuperRoadmapSetupModal
        isOpen={isSuperModalOpen}
        onClose={() => setIsSuperModalOpen(false)}
        onDone={handleSuperRoadmapDone}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <Typography className="text-[28px] font-bold text-text-primary">
          Super Roadmap
        </Typography>

        <button 
          onClick={() => setIsSuperModalOpen(true)} 
          className="h-[44px] px-8 bg-primary-900 rounded-lg text-white font-bold text-[13px] hover:brightness-110 transition-all shadow-lg"
        >
          Create Super roadmap
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-start pt-2">
        <div className="w-full max-w-[520px] h-12 bg-surface-primary border border-border-subtle rounded-xl flex items-center overflow-hidden focus-within:border-primary-900 transition-all shadow-sm">
          <div className="px-4">
            <Search className="h-5 w-5 text-text-secondary" />
          </div>
          <input 
            type="text" 
            placeholder="Search" 
            className="flex-1 h-full bg-transparent outline-none text-[15px] text-text-primary placeholder:text-text-secondary"
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

export default RoadmapSuperView;
