/**
 * MessageModal
 * Organism: a chat thread for messaging a school, tutor, or other party.
 *
 * The conversation arrives via props instead of three hardcoded seed messages.
 * The log is a live region, so messages added after mount are announced.
 *
 * @example
 * ```tsx
 * <MessageModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   conversationTitle="Beta Academy"
 *   initialMessages={thread}
 *   onSend={(text) => sendMessage(text)}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React, { useCallback, useEffect, useRef, useState } from "react";

import { Modal } from "@/components/atoms/Modal/Modal";
import { cn } from "@/lib/utils";
import { MessageComposer, MessageHeader, MessageLog } from "./MessageComposer";
import type { Message, MessageModalProps } from "./MessageModal.types";
import { contentClasses } from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ HOOK ############################# */
/**
 * Monotonic message ids.
 *
 * `Date.now()` was used before, which collides when two messages are added in
 * the same millisecond and makes React reuse a key — the same class of bug the
 * custom-parameters rows had.
 */
let nextMessageId = 0;

/** Formats the current time as `HH:mm`, zero-padding both fields. */
function currentTimestamp(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** Keeps the log scrolled to the newest message, returning the list ref. */
function useScrollToLatest(messages: readonly Message[]) {
  const logRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const log = logRef.current;
    if (log) {
      log.scrollTop = log.scrollHeight;
    }
  }, [messages]);

  return logRef;
}

/** Composer state: the draft, the emoji disclosure, and the send action. */
function useComposer(appendMessage: (message: Message) => void, onSend?: (text: string) => void) {
  const [draft, setDraft] = useState("");
  const [isEmojiOpen, setIsEmojiOpen] = useState(false);

  const send = useCallback(() => {
    const text = draft.trim();
    if (!text) {
      return;
    }
    nextMessageId += 1;
    appendMessage({
      id: `msg-${nextMessageId}`,
      text,
      timestamp: currentTimestamp(),
      sender: "me",
      status: "sent",
    });
    setDraft("");
    onSend?.(text);
  }, [appendMessage, draft, onSend]);

  return { draft, setDraft, isEmojiOpen, setIsEmojiOpen, send };
}
/** ################################ /HOOK ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

const DEFAULT_EMOJIS = ["😊", "😂", "🥰", "👍", "🔥", "🙏", "😮", "🤔"] as const;

/** A chat thread with an optimistic local composer. */
export function MessageModal({
  isOpen,
  onClose,
  initialMessages = [],
  conversationTitle = "Conversation",
  onSend,
  placeholder = "Type your message...",
  emojis = DEFAULT_EMOJIS,
  emptyMessage = "No messages yet. Say hello.",
  className,
}: Readonly<MessageModalProps>) {
  const [messages, setMessages] = useState<readonly Message[]>(initialMessages);
  const logRef = useScrollToLatest(messages);

  // Functional update, so a rapid second send cannot read a stale list.
  const appendMessage = useCallback(
    (message: Message) => setMessages((current) => [...current, message]),
    [],
  );
  const { draft, setDraft, isEmojiOpen, setIsEmojiOpen, send } = useComposer(appendMessage, onSend);

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} noPadding ariaLabel={`Message: ${conversationTitle}`}>
      <div className={cn(contentClasses, className)}>
        <MessageHeader title={conversationTitle} onClose={onClose} />
        <MessageLog
          messages={messages}
          peerName={conversationTitle}
          emptyMessage={emptyMessage}
          logRef={logRef}
        />
        <MessageComposer
          draft={draft}
          onDraftChange={setDraft}
          onSend={send}
          isEmojiOpen={isEmojiOpen}
          onToggleEmoji={() => setIsEmojiOpen((open) => !open)}
          onPickEmoji={(emoji) => {
            setDraft((current) => current + emoji);
            setIsEmojiOpen(false);
          }}
          emojis={emojis}
          placeholder={placeholder}
        />
      </div>
    </Modal>
  );
}

MessageModal.displayName = "MessageModal";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default MessageModal;
/** ################################ /EXPORTS ############################# */
