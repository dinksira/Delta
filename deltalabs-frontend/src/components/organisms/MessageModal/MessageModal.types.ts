/** ################################ TYPES ############################# */
/** Props contract for MessageModal. */

/** Which side of the conversation a message came from. */
export type MessageSender = "me" | "other";

/** Delivery state of an outgoing message. */
export type MessageStatus = "sent" | "delivered" | "read";

/** One message in the conversation. */
export interface Message {
  /** Stable id. */
  id: string;
  /** Message body. */
  text: string;
  /** `HH:mm` display time. */
  timestamp: string;
  /** Who sent it. */
  sender: MessageSender;
  /** Delivery state; only meaningful for `sender: "me"`. */
  status?: MessageStatus;
}

/** Props for {@link MessageModal}. */
export interface MessageModalProps {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog. */
  onClose: () => void;
  /**
   * Conversation to display. Supplied by the caller; the component no longer
   * seeds itself with three fake messages.
   */
  initialMessages?: readonly Message[];
  /** Name shown in the heading, e.g. a school or tutor. */
  conversationTitle?: string;
  /**
   * Fired with the trimmed body when a message is sent. The component keeps
   * the optimistic local copy so the log updates immediately.
   */
  onSend?: (text: string) => void;
  /** Placeholder for the composer. */
  placeholder?: string;
  /** Emoji offered by the picker. */
  emojis?: readonly string[];
  /** Message shown when there are no messages. */
  emptyMessage?: string;
  /** Extra classes merged onto the dialog content. */
  className?: string;
}
/** ################################ /TYPES ############################# */
