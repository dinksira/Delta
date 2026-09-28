/** ################################ COMPONENT ############################# */
/** Header, log, and composer of the MessageModal. */

import React from "react";

import type { RefObject } from "react";

import { ChevronLeft, Send } from "lucide-react";

import { Textarea } from "@/components/theme/Textarea";
import { EmojiPicker } from "./EmojiPicker";
import { MessageBubble } from "./MessageBubble";
import type { Message } from "./MessageModal.types";
import {
  backButtonClasses,
  composerClasses,
  emptyClasses,
  headerClasses,
  inputWrapperClasses,
  logClasses,
  sendButtonClasses,
  separatorClasses,
  separatorPillClasses,
  titleClasses,
} from "./variants";

/** Props for {@link MessageHeader}. */
export interface MessageHeaderProps {
  /** Conversation name, shown in the heading. */
  title: string;
  /** Dismisses the dialog. */
  onClose: () => void;
}

/** Heading row with a labelled close control. */
export function MessageHeader({ title, onClose }: Readonly<MessageHeaderProps>) {
  return (
    <div className={headerClasses}>
      <button type="button" onClick={onClose} aria-label="Close conversation" className={backButtonClasses}>
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      <h2 className={titleClasses}>Message: {title}</h2>
    </div>
  );
}

/** Props for {@link MessageLog}. */
export interface MessageLogProps {
  /** The thread to render. */
  messages: readonly Message[];
  /** Conversation name, used as the accessible sender label. */
  peerName: string;
  /** Shown when the thread is empty. */
  emptyMessage: string;
  /** Ref to the scrolling list. */
  logRef: RefObject<HTMLUListElement | null>;
}

/** The scrolling thread, or an empty state. */
export function MessageLog({
  messages,
  peerName,
  emptyMessage,
  logRef,
}: Readonly<MessageLogProps>) {
  if (messages.length === 0) {
    return <p className={emptyClasses}>{emptyMessage}</p>;
  }

  return (
    <ul
      ref={logRef}
      // A live region so messages arriving after mount are announced.
      role="log"
      aria-live="polite"
      aria-relevant="additions"
      aria-label="Conversation"
      className={logClasses}
    >
      <li className={separatorClasses}>
        <span className={separatorPillClasses}>Today</span>
      </li>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} peerName={peerName} />
      ))}
    </ul>
  );
}

/** Props for {@link MessageComposer}. */
export interface MessageComposerProps {
  /** Current draft. */
  draft: string;
  /** Updates the draft. */
  onDraftChange: (value: string) => void;
  /** Sends the trimmed draft. */
  onSend: () => void;
  /** Whether the emoji panel is expanded. */
  isEmojiOpen: boolean;
  /** Toggles the emoji panel. */
  onToggleEmoji: () => void;
  /** Appends an emoji to the draft. */
  onPickEmoji: (emoji: string) => void;
  /** Emoji to offer. */
  emojis: readonly string[];
  /** Composer placeholder. */
  placeholder: string;
}

/** Emoji toggle, multi-line composer, and send button. */
export function MessageComposer({
  draft,
  onDraftChange,
  onSend,
  isEmojiOpen,
  onToggleEmoji,
  onPickEmoji,
  emojis,
  placeholder,
}: Readonly<MessageComposerProps>) {
  return (
    <div className={composerClasses}>
      <EmojiPicker
        emojis={emojis}
        isOpen={isEmojiOpen}
        onToggle={onToggleEmoji}
        onSelect={onPickEmoji}
        label="Insert emoji"
      />

      <div className={inputWrapperClasses}>
        <Textarea
          rows={1}
          value={draft}
          placeholder={placeholder}
          aria-label="Message"
          onChange={(event) => onDraftChange(event.target.value)}
          // Enter sends, Shift+Enter inserts a newline.
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              onSend();
            }
          }}
          className="resize-none border-0 bg-transparent p-0 shadow-none focus:border-0 focus:ring-0"
        />
      </div>

      <button
        type="button"
        onClick={onSend}
        disabled={!draft.trim()}
        aria-label="Send message"
        className={sendButtonClasses}
      >
        <Send className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
