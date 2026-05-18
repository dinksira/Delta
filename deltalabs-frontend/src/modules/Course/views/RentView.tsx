import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import RentCard, { RentCardProps, RentCardVariant } from '@/components/molecules/RentCard';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { cx } from '@/components/theme/utils';

export interface RentViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

type RentTab = 'resources' | 'on-hand' | 'history';

export const RentView: React.FC<RentViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const [activeRentTab, setActiveRentTab] = useState<RentTab>('resources');

  // Mock data matching the design
  const mockResources: RentCardProps[] = [
    {
      id: '1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Available Items',
      rating: 4.8,
      reviewCount: 65,
      variant: 'resources',
    },
    {
      id: '2',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Available Items',
      rating: 4.8,
      reviewCount: 65,
      variant: 'resources',
    },
    {
      id: '3',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Available Items',
      rating: 4.8,
      reviewCount: 65,
      variant: 'resources',
    },
    {
      id: '4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Available Items',
      rating: 4.8,
      reviewCount: 65,
      variant: 'resources',
    }
  ];

  const mockOnHand: RentCardProps[] = [
    {
      id: 'oh-1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Days left',
      rating: 4.8,
      reviewCount: 65,
      variant: 'on-hand',
    },
    {
      id: 'oh-2',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Days Pass due date',
      statusColor: 'error',
      rating: 4.8,
      reviewCount: 65,
      variant: 'on-hand',
    },
    {
      id: 'oh-3',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Days left',
      rating: 4.8,
      reviewCount: 65,
      variant: 'on-hand',
    },
    {
      id: 'oh-4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      badgeText: 'Necessary',
      price: 'ETB 1,160',
      statusText: '15 Days left',
      rating: 4.8,
      reviewCount: 65,
      variant: 'on-hand',
    }
  ];

  const mockHistory: RentCardProps[] = mockResources.map(r => ({
    ...r,
    variant: 'history',
    statusText: '15 Items',
    badgeText: undefined
  }));

  const displayItems = 
    activeRentTab === 'resources' ? mockResources : 
    activeRentTab === 'on-hand' ? mockOnHand : 
    mockHistory;

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
            Rent resources
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
          </div>
        </div>
      }
    >
      <div className="space-y-10">
        {/* Search */}
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

        {/* Tabs */}
        <div className="flex items-center gap-12 border-b border-border-default/50">
          {[
            { id: 'resources', label: 'Resources' },
            { id: 'on-hand', label: 'On Hand' },
            { id: 'history', label: 'Rent History' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveRentTab(tab.id as RentTab)}
              className={cx(
                "pb-4 text-sm font-bold transition-all relative",
                activeRentTab === tab.id ? "text-[#174A5F]" : "text-[#64748B] hover:text-[#174A5F]"
              )}
            >
              {tab.label}
              {activeRentTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
              )}
            </button>
          ))}
        </div>

        {/* Rent Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 py-4">
          {displayItems.map((item) => (
            <RentCard
              key={item.id}
              {...item}
              onAction={() => console.log('Action', item.id)}
            />
          ))}
        </div>
      </div>
    </ResourceManagementLayout>
  );
};

export default RentView;
