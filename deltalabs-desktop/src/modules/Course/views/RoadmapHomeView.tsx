import React from 'react';
import { CourseDashboardLayout } from '@/components/templates/CourseDashboardLayout';

export const RoadmapHomeView: React.FC = () => {
  return (
    <CourseDashboardLayout header={<div className="px-8 py-4 border-b border-border-default"><h1 className="text-2xl font-semibold">Learning Roadmaps</h1></div>}>
      <div className="p-8 text-center"><p>Interactive learning roadmaps coming soon.</p></div>
    </CourseDashboardLayout>
  );
};
