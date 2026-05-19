import React, { useState } from 'react';
import { ResourceSidebarTabId } from '@/components/organisms/ResourceSidebar';
import { MarketplaceHomeView } from './MarketplaceHomeView';
import { CartView } from './CartView';
import { OrderView } from './OrderView';
import { RentView } from './RentView';
import { NotificationView } from './NotificationView';
import { MyResourcesView } from './MyResourcesView';

export const ResourceManagementView: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<ResourceSidebarTabId>('home');

  const handleSidebarTabChange = (tabId: ResourceSidebarTabId) => {
    setActiveSidebarTab(tabId);
  };

  switch (activeSidebarTab) {
    case 'home':
      return (
        <MarketplaceHomeView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    case 'cart':
      return (
        <CartView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    case 'order':
      return (
        <OrderView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    case 'rent':
      return (
        <RentView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    case 'notification':
      return (
        <NotificationView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    case 'resources':
      return (
        <MyResourcesView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
    default:
      return (
        <MarketplaceHomeView 
          activeSidebarTab={activeSidebarTab} 
          onSidebarTabChange={handleSidebarTabChange} 
        />
      );
  }
};

export default ResourceManagementView;
