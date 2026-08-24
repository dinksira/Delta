/**
 * CourseDashboardLayout
 * Atomic Level: Template
 * 
 * Main layout for the Course module with a left sidebar (SideRail usually) and main content area.
 */

import React from 'react';

export interface CourseDashboardLayoutProps {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
  header?: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export const CourseDashboardLayout: React.FC<CourseDashboardLayoutProps> = ({
  sidebar,
  children,
  header,
  rightSidebar,
}) => {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-canvas">
      {/* Primary Sidebar (e.g., SideRail navigation) */}
      {sidebar && (
        <aside className="h-full z-20 flex-shrink-0">
          {sidebar}
        </aside>
      )}

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {header && (
          <header className="flex-shrink-0 border-b border-border-default bg-surface-primary sticky top-0 z-10">
            {header}
          </header>
        )}
        
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>

      {/* Optional Right Sidebar (e.g., for filters, specific tools) */}
      {rightSidebar && (
        <aside className="h-full w-80 flex-shrink-0 border-l border-border-default bg-surface-primary z-20 hidden lg:block overflow-y-auto">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
};

CourseDashboardLayout.displayName = 'CourseDashboardLayout';
