/**
 * CommunityContactItem Types
 * Type definitions for the CommunityContactItem component.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunityContactItemProps {
  id: string;
  name: string;
  handle: string;
  avatar?: string;
  statusText: string;
  onlineStatus?: string; // 'Online' or date like 'Oct 12'
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityContactItemProps;
