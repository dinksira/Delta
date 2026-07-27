import React from 'react';
import { CourseDashboardLayout } from '@/components/templates/CourseDashboardLayout';

export const RoadmapCommunityView: React.FC = () => {
  return (
    <CourseDashboardLayout header={<div className="px-8 py-4 border-b border-border-default"><h1 className="text-2xl font-semibold">Community Roadmaps</h1></div>}>
      <div className="p-8 text-center"><p>Community roadmap view coming soon.</p></div>
    </CourseDashboardLayout>
  );
};
