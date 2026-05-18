import React, { useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Typography } from '@/components/theme';
import { ResourceSidebar, ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { OrderGrid } from '@/components/organisms/OrderGrid';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { OrderCardProps } from '@/components/molecules/OrderCard';
import { cx } from '@/components/theme/utils';

export interface OrderViewProps {
  activeSidebarTab: ResourceSidebarTabId;
  onSidebarTabChange: (tabId: ResourceSidebarTabId) => void;
}

type OrderTab = 'purchase' | 'rent' | 'financial-aid' | 'rejected';

export const OrderView: React.FC<OrderViewProps> = ({
  activeSidebarTab,
  onSidebarTabChange,
}) => {
  const [activeOrderTab, setActiveOrderTab] = useState<OrderTab>('purchase');

  // Mock data for regular orders
  const regularOrders: OrderCardProps[] = [
    {
      id: '1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      type: 'purchase',
    },
    {
      id: '2',
      title: 'IPS LCD Gaming Monitor',
      image: '/newton_cradle.png', // Image from the screenshot
      type: 'purchase',
    },
    {
      id: '3',
      title: 'IPS LCD Gaming Monitor',
      image: '/laboratory_glass.png',
      type: 'purchase',
    },
    {
      id: '4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_2.png',
      type: 'purchase',
    }
  ];

  // Mock data for financial aid
  const financialAidOrders: OrderCardProps[] = [
    {
      id: 'fa-1',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      type: 'financial-aid',
      status: 'requested',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
    },
    {
      id: 'fa-2',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      type: 'financial-aid',
      status: 'rejected',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
    },
    {
      id: 'fa-3',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      type: 'financial-aid',
      status: 'rejected',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
    },
    {
      id: 'fa-4',
      title: 'IPS LCD Gaming Monitor',
      image: '/gaming_monitor_1.png',
      type: 'financial-aid',
      status: 'requested',
      institutionName: 'Addis ababa university',
      price: 'br. 1160',
      rating: 4.8,
      reviewCount: 65,
      location: 'Addis Ababa',
    }
  ];

  const displayOrders = activeOrderTab === 'financial-aid' ? financialAidOrders : regularOrders;

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
            Order
          </Typography>
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
            { id: 'purchase', label: 'My Order (Purchase)' },
            { id: 'rent', label: 'My Order (Rent)' },
            { id: 'financial-aid', label: 'Financial Aid' },
            { id: 'rejected', label: 'Rejected Orders' },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveOrderTab(tab.id as OrderTab)}
              className={cx(
                "pb-4 text-sm font-bold transition-all relative",
                activeOrderTab === tab.id ? "text-[#174A5F]" : "text-[#64748B] hover:text-[#174A5F]"
              )}
            >
              {tab.label}
              {activeOrderTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#174A5F]" />
              )}
            </button>
          ))}
        </div>

        {/* Orders Grid */}
        <OrderGrid 
          orders={displayOrders} 
          onShowOnMap={(id) => console.log('Show on map', id)}
          onCancelOrder={(id) => console.log('Cancel order', id)}
          onOrderReceived={(id) => console.log('Order received', id)}
        />
      </div>
    </ResourceManagementLayout>
  );
};

export default OrderView;
