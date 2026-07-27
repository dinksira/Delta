"use client";

import React, { useState } from 'react';
import { RoadmapSidebar, RoadmapSidebarTabId } from '@/components/organisms/RoadmapSidebar';
import { ResourceManagementLayout } from '@/components/templates/ResourceManagementLayout';
import { RoadmapHomeView } from './RoadmapHomeView';
import { RoadmapPersonalView } from './RoadmapPersonalView';
import { RoadmapCommunityView } from './RoadmapCommunityView';
import { RoadmapSuperView } from './RoadmapSuperView';

export const RoadmapView: React.FC = () => {
  const [activeSidebarTab, setActiveSidebarTab] = useState<RoadmapSidebarTabId>('home');

  const renderContent = () => {
    switch (activeSidebarTab) {
      case 'home':
        return <RoadmapHomeView />;
      case 'personal':
        return <RoadmapPersonalView />;
      case 'community':
        return <RoadmapCommunityView />;
      case 'super':
        return <RoadmapSuperView />;
      default:
        return <RoadmapHomeView />;
    }
  };

  return (
    <ResourceManagementLayout
      sidebar={
        <RoadmapSidebar 
          activeTab={activeSidebarTab} 
          onTabChange={setActiveSidebarTab} 
        />
      }
      header={<div />}
    >
      {renderContent()}
    </ResourceManagementLayout>
  );
};

export default RoadmapView;
