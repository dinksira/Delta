/**
 * CommunityTabNav Types
 * Type definitions for the CommunityTabNav component.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export type CommunityTab = 'community' | 'group' | 'setting';

export interface CommunityTabNavProps {
  activeTab: CommunityTab;
  onTabChange: (tab: CommunityTab) => void;
  className?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityTabNavProps;
