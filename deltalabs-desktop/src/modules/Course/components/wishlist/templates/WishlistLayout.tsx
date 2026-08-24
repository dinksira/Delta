/**
 * WishlistLayout
 * Atomic Level: Template
 *
 * Layout component for the wishlist page. 
 * Defines the main grid: main content list on the left, sidebar on the right.
 */

import React from 'react';

export interface WishlistLayoutProps {
  breadcrumb: React.ReactNode;
  searchBar: React.ReactNode;
  selectAllControl: React.ReactNode;
  mainList: React.ReactNode;
  sidebar: React.ReactNode;
}

export const WishlistLayout: React.FC<WishlistLayoutProps> = ({
  breadcrumb,
  searchBar,
  selectAllControl,
  mainList,
  sidebar,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas p-6 md:p-10 lg:p-12">
      
      {/* Top Header Section */}
      <div className="relative w-full mb-8">
        {/* Breadcrumb Absolute positioned to the top left */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 text-sm font-medium flex items-center text-primary-600 gap-1.5">
          {breadcrumb}
        </div>
        
        {/* Centered Search Bar & FAB */}
        {searchBar}
      </div>

      {/* Select All Row */}
      <div className="w-full max-w-7xl mx-auto flex mb-4">
        {selectAllControl}
      </div>

      {/* Main Grid Layout */}
      <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 pb-24">
        
        {/* Left Column: Course List */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {mainList}
        </div>

        {/* Right Column: Summaries & Trackers */}
        <div className="lg:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-sm sticky top-6">
            {sidebar}
          </div>
        </div>

      </div>
    </div>
  );
};

export default WishlistLayout;
