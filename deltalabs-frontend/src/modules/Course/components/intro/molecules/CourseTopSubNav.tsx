/**
 * CourseTopSubNav
 * Horizontal tab navigation displayed at the top of the course detail workspace.
 * Maximizes horizontal breathing room between tabs while sharply minimizing vertical height.
 *
 * @example
 * ```tsx
 * <CourseTopSubNav activeTab="intro" onTabChange={(tab) => handleTabChange(tab)} />
 * ```
 */

import React from 'react';

import { CourseSubNavTab } from '../atoms/CourseSubNavTab';

import type { CourseSubNavTabId, CourseTopSubNavProps } from './CourseTopSubNav.types';

export type { CourseSubNavTabId, CourseTopSubNavProps };

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TabDefinition {
  id: CourseSubNavTabId;
  label: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SUB_NAV_TABS: readonly TabDefinition[] = [
  { id: 'intro', label: 'Intro' },
  { id: 'about', label: 'About Course' },
  { id: 'related', label: 'Related Courses' },
  { id: 'reviews', label: 'Reviews & Rating' },
  { id: 'prerequisites', label: 'Prerequisites & Requirements' },
  { id: 'analysis', label: 'Course Analysis' },
  { id: 'tutor', label: 'Hire tutor' },
] as const;

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseTopSubNav: React.FC<Readonly<CourseTopSubNavProps>> = ({
  activeTab,
  onTabChange,
}) => {
  // Ordered classes: Layout → Spacing → Typography → Colors → Effects
  const containerClasses = [
    'flex items-center justify-start md:justify-center w-full overflow-x-auto scrollbar-hide',
    'px-4 py-1 gap-x-8',
    '',
    'border-b border-border-subtle',
    '',
  ].filter(Boolean).join(' ');

  return (
    <nav
      className={containerClasses}
      role="tablist"
      aria-label="Course detail sections"
    >
      {SUB_NAV_TABS.map((tab) => (
        <div key={tab.id} className="flex-shrink-0">
          <CourseSubNavTab
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          />
        </div>
      ))}
    </nav>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

CourseTopSubNav.displayName = 'CourseTopSubNav';

export default CourseTopSubNav;