/** ################################ COMPONENT ############################# */
/**
 * CourseDetailLayout: Layout component for the Course Detail page.
 * Divides the viewport into header, main content (split into left media area
 * and right engagement area), and a bottom dock.
 */

import React, { type ReactNode } from "react";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CourseDetailLayoutProps {
  /** The top breadcrumb and action header */
  header: ReactNode;
  /** The top horizontal sub-navigation */
  subNavigation: ReactNode;
  /** Left-side media display (video/image viewer + thumbnail strip) */
  mediaViewer: ReactNode;
  /** Right-side interaction panel (author, stats, comments) */
  engagementPanel: ReactNode;
  /** The floating bottom navigation dock */
  bottomDock?: ReactNode;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseDetailLayout: React.FC<Readonly<CourseDetailLayoutProps>> = ({
  header,
  subNavigation,
  mediaViewer,
  engagementPanel,
  bottomDock,
}) => {
  return (
    <div className="flex flex-col min-h-screen bg-surface-canvas text-text-primary px-6 py-6 md:px-12 md:py-8 pb-12">
      {/* Container to restrict max width for large screens */}
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        
        {/* --- HEADER --- */}
        <header className="w-full">
          {header}
        </header>

        {/* --- SUB-NAVIGATION --- */}
        <div className="w-full">
          {subNavigation}
        </div>

        {/* --- MAIN GRID --- */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start w-full">
          {/* Left Side: Media and content details */}
          <section className="lg:col-span-2 flex flex-col gap-6 w-full">
            {mediaViewer}
          </section>

          {/* Right Side: Engagement, author, and comments */}
          <aside className="lg:col-span-1 w-full bg-surface-primary border border-border-subtle rounded-2xl p-5 shadow-sm">
            {engagementPanel}
          </aside>
        </main>
      </div>

      {/* --- FLOATING BOTTOM DOCK --- */}
      {bottomDock && bottomDock}
    </div>
  );
};

CourseDetailLayout.displayName = "CourseDetailLayout";
/** ################################ /COMPONENT ############################# */
