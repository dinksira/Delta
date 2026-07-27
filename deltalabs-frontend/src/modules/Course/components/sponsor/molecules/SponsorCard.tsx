/**
 * SponsorCard
 * Atomic Level: Molecule
 *
 * Card displaying a sponsor's profile with an action depending on the active tab.
 */

import React from 'react';
import { ExternalLink } from 'lucide-react';
import type { SponsorTabType } from './SponsorTabs';

export type SponsorStatus = 'Applied' | 'Waiting' | 'Accepted' | 'Rejected' | 'None';

export interface SponsorData {
  id: string;
  name: string;
  description: string;
  url: string;
  urlText: string;
  bannerImage: string;
  avatarImage: string;
  status: SponsorStatus;
}

export interface SponsorCardProps {
  sponsor: SponsorData;
  activeTab: SponsorTabType;
  onApply?: () => void;
}

export const SponsorCard: React.FC<SponsorCardProps> = ({ sponsor, activeTab, onApply }) => {
  // Render bottom right action/status text
  const renderActionSlot = () => {
    if (activeTab === 'sponsors') {
      return (
        <button
          onClick={onApply}
          className="px-6 py-1.5 bg-[#1F4156] text-white text-sm font-medium rounded-full shadow-sm hover:bg-[#153040] transition-colors"
        >
          Apply
        </button>
      );
    }

    // Applied tab logic
    switch (sponsor.status) {
      case 'Accepted':
        return <span className="text-emerald-500 font-medium text-sm">Accepted</span>;
      case 'Waiting':
        return <span className="text-amber-500 font-medium text-sm">Waiting</span>;
      case 'Rejected':
        return <span className="text-red-500 font-medium text-sm">Rejected</span>;
      case 'Applied':
      default:
        return <span className="text-[#1F4156] font-medium text-sm">Applied</span>;
    }
  };

  return (
    <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full relative p-4">
      
      {/* Banner Area */}
      <div className="relative w-full h-[100px] mb-8">
        <div className="w-full h-full rounded-2xl overflow-hidden bg-gray-200">
          <img
            src={sponsor.bannerImage}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Overlapping Avatar */}
        <div className="absolute -bottom-6 left-4 w-16 h-16 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm">
          <img
            src={sponsor.avatarImage}
            alt={sponsor.name}
            className="w-full h-full object-cover bg-primary-800"
          />
        </div>
      </div>

      {/* Content Area */}
      <div className="flex flex-col flex-1 px-2 pb-2">
        <h3 className="font-bold text-gray-900 text-[15px] mb-2">{sponsor.name}</h3>
        
        <p className="text-gray-500 text-xs leading-relaxed mb-6">
          {sponsor.description}
        </p>

        {/* Bottom Row */}
        <div className="flex items-center justify-between mt-auto pt-2">
          {/* Link */}
          <a
            href={sponsor.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 text-blue-500 text-[11px] font-medium hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {sponsor.urlText}
          </a>

          {/* Action / Status */}
          <div className="flex items-center h-8">
            {renderActionSlot()}
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default SponsorCard;
