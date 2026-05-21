import React, { useState } from 'react';
import { Search, SlidersHorizontal, Plus } from 'lucide-react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import MyResourceCard, { MyResourceCardProps, MyResourceTab } from '@/components/molecules/MyResourceCard';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { cx } from '@/components/theme/utils';

export interface MyResourcesViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

export const MyResourcesView: React.FC<MyResourcesViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const [activeTab, setActiveTab] = useState<MyResourceTab>('my-resources');

  const mockResources: MyResourceCardProps[] = [
    {
      id: '1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      statusText: '15 Items',
      tab: activeTab,
      sharedWith: activeTab === 'shared' ? [
        { avatar: '', name: 'User 1' },
        { avatar: '', name: 'User 2' },
        { avatar: '', name: 'User 3' },
      ] : undefined,
      sharedCount: activeTab === 'shared' ? 3 : undefined,
    },
    {
      id: '2',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      statusText: '15 Items',
      tab: activeTab,
      sharedWith: activeTab === 'shared' ? [
        { avatar: '', name: 'User 1' },
        { avatar: '', name: 'User 2' },
        { avatar: '', name: 'User 3' },
      ] : undefined,
      sharedCount: activeTab === 'shared' ? 3 : undefined,
    },
    {
      id: '3',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      statusText: '15 Items',
      tab: activeTab,
      sharedWith: activeTab === 'shared' ? [
        { avatar: '', name: 'User 1' },
        { avatar: '', name: 'User 2' },
        { avatar: '', name: 'User 3' },
      ] : undefined,
      sharedCount: activeTab === 'shared' ? 3 : undefined,
    },
    {
      id: '4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      statusText: '15 Items',
      tab: activeTab,
      sharedWith: activeTab === 'shared' ? [
        { avatar: '', name: 'User 1' },
        { avatar: '', name: 'User 2' },
        { avatar: '', name: 'User 3' },
      ] : undefined,
      sharedCount: activeTab === 'shared' ? 3 : undefined,
    }
  ];

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
            My resources
          </Typography>

          <button className="h-[44px] px-6 bg-[#174A5F] rounded-lg text-white font-bold text-sm flex items-center gap-2 hover:bg-[#133e50] transition-all shadow-md">
            <Plus className="h-5 w-5 border-2 border-white rounded-full p-0.5" />
            Add Resource
          </button>
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
        <div className="flex items-center gap-12 border-b border-border-default/50 overflow-x-auto no-scrollbar">
          {[
            { id: 'my-resources', label: 'My Resources' },
            { id: 'used', label: 'Used' },
            { id: 'rent', label: 'Rent' },
            { id: 'shared', label: 'Shared' },
            { id: 'sold', label: 'Sold' },
            { id: 'rented', label: 'Rented' },
            { id: 'orders', label: 'Orders' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MyResourceTab)}
              className={cx(
                "pb-4 text-sm font-bold transition-all relative whitespace-nowrap",
                activeTab === tab.id ? "text-[#174A5F]" : "text-[#64748B] hover:text-[#174A5F]"
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
              )}
            </button>
          ))}
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 py-4">
          {mockResources.map((resource) => (
            <MyResourceCard
              key={resource.id}
              {...resource}
              onAction={(action) => console.log('Action', action, resource.id)}
            />
          ))}
        </div>
      </div>
    </ResourceManagementLayout>
  );
};

export default MyResourcesView;
