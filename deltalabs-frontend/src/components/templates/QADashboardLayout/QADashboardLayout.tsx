/**
 * QADashboardLayout
 * Atomic Level: Template
 * 
 * Tabbed layout for Q&A management (My Questions, Community Questions, etc.).
 */

import React from 'react';

export interface QADashboardLayoutProps {
  header: React.ReactNode;
  tabs: React.ReactNode;
  filters?: React.ReactNode;
  content: React.ReactNode;
}

export const QADashboardLayout: React.FC<QADashboardLayoutProps> = ({
  header,
  tabs,
  filters,
  content,
}) => {
  return (
    <div className="flex flex-col h-full bg-surface-canvas overflow-hidden">
      {/* Header section (Title & Global Actions) */}
      <div className="flex-shrink-0 bg-surface-primary px-8 pt-8 pb-4">
        {header}
      </div>

      {/* Navigation Tabs */}
      <div className="flex-shrink-0 bg-surface-primary px-8 border-b border-border-default">
        {tabs}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {filters && (
          <div className="flex-shrink-0 p-4 bg-surface-default border-b border-border-subtle">
            <div className="max-w-6xl mx-auto w-full">
              {filters}
            </div>
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto w-full pb-12">
            {content}
          </div>
        </div>
      </div>
    </div>
  );
};

QADashboardLayout.displayName = 'QADashboardLayout';
