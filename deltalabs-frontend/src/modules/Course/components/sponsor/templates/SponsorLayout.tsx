/**
 * SponsorLayout
 * Atomic Level: Template
 *
 * Defines the layout for the Sponsor page.
 */

import React from 'react';

export interface SponsorLayoutProps {
  breadcrumb: React.ReactNode;
  searchBar: React.ReactNode;
  tabs: React.ReactNode;
  gridContent: React.ReactNode;
}

export const SponsorLayout: React.FC<SponsorLayoutProps> = ({
  breadcrumb,
  searchBar,
  tabs,
  gridContent,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas p-6 md:p-10 lg:p-12">
      
      {/* Top Header Section */}
      <div className="relative w-full mb-4">
        {/* Breadcrumb Absolute positioned to the top left */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 text-sm font-medium flex items-center text-primary-600 gap-1.5 z-10">
          {breadcrumb}
        </div>
        
        {/* Centered Search Bar */}
        {searchBar}
      </div>

      {/* Tabs */}
      <div className="mb-10">
        {tabs}
      </div>

      {/* Grid Content */}
      <div className="w-full max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {gridContent}
        </div>
      </div>

    </div>
  );
};

export default SponsorLayout;
