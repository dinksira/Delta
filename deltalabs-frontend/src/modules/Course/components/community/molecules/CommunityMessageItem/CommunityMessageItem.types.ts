/**
 * CommunityMessageItem Types
 * Type definitions for the CommunityMessageItem component.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunityMessageItemProps {
  id: string;
  content: string;
  timestamp: string;
  isSender: boolean;
  senderName?: string;
  senderAvatar?: string;
  className?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityMessageItemProps;
