import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { ResourceGrid } from '@/components/organisms/ResourceGrid';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { ResourceCardProps } from '@/components/molecules/ResourceCard';
import { cx } from '@/components/theme/utils';

export interface MarketplaceHomeViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

export const MarketplaceHomeView: React.FC<MarketplaceHomeViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const [activeContentTab, setActiveContentTab] = useState<'resources' | 'community'>('resources');

  const marketplaceResources: ResourceCardProps[] = [
    {
      id: '1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      badgeVariant: 'success',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
      type: 'marketplace',
    },
    {
      id: '2',
      title: 'IPS LCD Gaming Monitor',
      image: '/safety_goggles.png',
      badgeText: 'Used',
      badgeVariant: 'warning',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
      type: 'marketplace',
    },
    {
      id: '3',
      title: 'IPS LCD Gaming Monitor',
      image: '/laboratory_glass.png',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
      type: 'marketplace',
    },
    {
      id: '4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_2.png',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
      type: 'marketplace',
    }
  ];

  const communityResources: ResourceCardProps[] = marketplaceResources.map(r => ({
    ...r,
    type: 'community' as const
  }));

  const resources = activeContentTab === 'resources' ? marketplaceResources : communityResources;

  return (
    <ResourceManagementLayout
      sidebar={
        <ResourceSidebar 
          activeTab={activeSidebarTab} 
          onTabChange={onSidebarTabChange} 
        />
      }
      header={
        <div className="flex items-center justify-between">
          <Typography variant="h1" className="text-[32px] font-bold text-[#174A5F]">
            Resources
          </Typography>

          <div className="flex items-center gap-4">
            <div className="bg-white border border-[#174A5F]/10 rounded-xl px-6 py-3 flex flex-col items-center min-w-[140px] shadow-sm">
              <Typography className="text-[10px] font-bold text-[#174A5F]/40 uppercase tracking-wider">
                Total Budget
              </Typography>
              <Typography className="text-xl font-bold text-[#174A5F]">
                300 birr
              </Typography>
            </div>

            <button className="h-[52px] px-6 border-2 border-[#174A5F] rounded-xl text-[#174A5F] font-bold text-sm uppercase tracking-wide hover:bg-[#174A5F]/5 transition-all">
              Find Sponsor
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        <div className="flex justify-center pt-2">
          <div className="w-full max-w-[520px] h-12 bg-[#F8FAFC] border border-[#174A5F]/10 rounded-xl flex items-center overflow-hidden focus-within:border-[#174A5F]/30 transition-all">
            <div className="px-4">
              <Search className="h-5 w-5 text-[#174A5F]/40" />
            </div>
            <input 
              type="text" 
              placeholder="Search" 
              className="flex-1 h-full bg-transparent outline-none text-[15px] text-[#174A5F] placeholder:text-[#174A5F]/30"
            />
            <div className="h-full w-px bg-[#174A5F]/10" />
            <button className="px-4 h-full hover:bg-[#174A5F]/5 transition-colors">
              <SlidersHorizontal className="h-5 w-5 text-[#174A5F]" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-12 border-b border-border-default/50">
          <button 
            onClick={() => setActiveContentTab('resources')}
            className={cx(
              "pb-4 text-sm font-bold transition-all relative",
              activeContentTab === 'resources' ? "text-[#174A5F]" : "text-[#64748B] hover:text-[#174A5F]"
            )}
          >
            Resources
            {activeContentTab === 'resources' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
            )}
          </button>
          <button 
            onClick={() => setActiveContentTab('community')}
            className={cx(
              "pb-4 text-sm font-bold transition-all relative",
              activeContentTab === 'community' ? "text-[#174A5F]" : "text-[#64748B] hover:text-[#174A5F]"
            )}
          >
            Community Resources
            {activeContentTab === 'community' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
            )}
          </button>
        </div>

        <ResourceGrid 
          resources={resources} 
          onAddToCart={(id) => console.log('Add to cart', id)}
          onShare={(id) => console.log('Share', id)}
        />
      </div>
    </ResourceManagementLayout>
  );
};

export default MarketplaceHomeView;
