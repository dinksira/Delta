/**
 * CommunitySidebar Types
 * Type definitions for the CommunitySidebar component.
 */

import type { CommunityTab } from '../../molecules/CommunityTabNav';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunityContact {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  statusText: string;
  onlineStatus?: string;
}

export interface CommunityGroup {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  memberCount: number;
}

export interface CommunitySidebarProps {
  activeTab: CommunityTab;
  activeContactId?: string;
  contacts: CommunityContact[];
  groups: CommunityGroup[];
  onTabChange: (tab: CommunityTab) => void;
  onContactClick: (id: string) => void;
  onGroupClick: (id: string) => void;
  className?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunitySidebarProps;
