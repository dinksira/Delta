/**
 * AiAssistantModal Types
 * Type definitions for the AI Assistant modal component.
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Props for the AiAssistantModal component. */
export interface AiAssistantModalProps {
  /** Whether the modal is currently visible. */
  isOpen?: boolean;
  /** Callback fired when the modal should close. */
  onClose: () => void;
  /** Optional additional CSS class names. */
  className?: string;
}

/** A single message in the assistant conversation. */
export interface ChatMessage {
  /** Unique message identifier. */
  id: string;
  /** Who sent the message. */
  role: 'user' | 'assistant';
  /** The message text content. */
  content: string;
  /** When the message was created. */
  timestamp: Date;
}

// ============================================================================
// EXPORTS
// ============================================================================

export type { AiAssistantModalProps as AiAssistantModalPropsType };
