import React from 'react';
import { CourseDashboardLayout } from '@/components/templates/CourseDashboardLayout';
import { Button } from '@/components/theme';

export const MarketplaceHomeView: React.FC = () => {
  return (
    <CourseDashboardLayout
      header={
        <div className="flex justify-between items-center px-8 py-4 bg-surface-primary border-b border-border-default">
          <h1 className="text-2xl font-semibold text-text-primary">Marketplace</h1>
          <Button variant="primary">Sell Resource</Button>
        </div>
      }
    >
      <div className="p-8 max-w-7xl mx-auto text-center py-20">
        <h2 className="text-xl font-medium text-text-primary mb-4">Marketplace coming soon</h2>
        <p className="text-text-secondary">Discover premium resources, tools, and materials.</p>
      </div>
    </CourseDashboardLayout>
  );
};
