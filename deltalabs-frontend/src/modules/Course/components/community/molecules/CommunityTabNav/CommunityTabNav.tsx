/**
 * CommunityTabNav
 * Tab navigation for the community section with Community/Group/Settings tabs.
 *
 * @example
 * ```tsx
 * <CommunityTabNav activeTab="community" onTabChange={setActiveTab} />
 * ```
 */

import React from 'react';
import type { CommunityTabNavProps } from './CommunityTabNav.types';
import { Typography } from '@/components/theme';

// ============================================================================
// CONSTANTS
// ============================================================================

const TABS: { id: CommunityTabNavProps['activeTab']; label: string }[] = [
  { id: 'community', label: 'Community' },
  { id: 'group', label: 'Group' },
  { id: 'setting', label: 'Setting' },
];

// ============================================================================
// COMPONENT
// ============================================================================

export const CommunityTabNav: React.FC<CommunityTabNavProps> = ({
  activeTab,
  onTabChange,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center gap-2 ${className}`} {...props}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`
            px-4 py-2 text-sm font-medium rounded-lg transition-colors
            ${activeTab === tab.id 
              ? 'text-primary-900 border-b-2 border-primary-900' 
              : 'text-text-secondary hover:text-text-primary'
            }
          `}
        >
          <Typography className="text-sm font-medium">{tab.label}</Typography>
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityTabNav;
