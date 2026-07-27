/**
 * CommunityChatArea Types
 * Type definitions for the CommunityChatArea component.
 */

import type { CommunityContact } from '../CommunitySidebar';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CommunityMessage {
  id: string;
  content: string;
  timestamp: string;
  isSender: boolean;
  senderName: string;
  senderAvatar?: string;
}

export interface CommunityChatAreaProps {
  activeContact?: CommunityContact;
  messages: CommunityMessage[];
  messageInput: string;
  onMessageInputChange: (value: string) => void;
  onSendMessage: () => void;
  className?: string;
}

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityChatAreaProps;
