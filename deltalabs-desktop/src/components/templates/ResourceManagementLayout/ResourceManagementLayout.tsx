import React from 'react';

export interface ResourceManagementLayoutProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
  rightSidebar?: React.ReactNode;
}

export const ResourceManagementLayout: React.FC<ResourceManagementLayoutProps> = ({
  sidebar,
  header,
  children,
  rightSidebar,
}) => {
  return (
    <div className="flex min-h-screen w-full bg-white">
      {/* Sidebar */}
      {sidebar}

      {/* Main Content Area */}
      <main className="flex-1 ml-[68px] min-w-0 overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Header */}
          <header className="shrink-0 px-8 py-6">
            {header}
          </header>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto px-8 pb-10">
            {children}
          </div>
        </div>
      </main>

      {/* Right Sidebar (Summary) */}
      {rightSidebar && (
        <aside className="w-[380px] shrink-0 border-l border-border-default/50 p-8 pt-24 overflow-y-auto">
          {rightSidebar}
        </aside>
      )}
    </div>
  );
};


export default ResourceManagementLayout;
