/** ################################ COMPONENT ############################# */
/** One message bubble inside MessageModal. */

import React from "react";

import { Check, CheckCheck } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Message } from "./MessageModal.types";
import {
  bodyClasses,
  bubbleClasses,
  bubbleMineClasses,
  bubbleRowClasses,
  bubbleRowMineClasses,
  bubbleRowTheirsClasses,
  bubbleTheirsClasses,
  metaClasses,
  metaClassesMine,
  metaClassesTheirs,
} from "./variants";

/** Props for {@link MessageBubble}. */
export interface MessageBubbleProps {
  /** The message to render. */
  message: Message;
  /** Accessible name for the other party, used in the visually hidden prefix. */
  peerName: string;
}

/** True when the message is from the current user. */
function isMine(message: Message): boolean {
  return message.sender === "me";
}

/**
 * A single chat bubble.
 *
 * The sender and the time are exposed to assistive tech through a visually
 * hidden prefix, because the visible layout conveys them with alignment and
 * colour alone. The timestamp is a real `<time>` so it is machine-readable.
 */
export function MessageBubble({ message, peerName }: Readonly<MessageBubbleProps>) {
  const mine = isMine(message);
  const isRead = message.status === "read";

  return (
    <li className={cn(bubbleRowClasses, mine ? bubbleRowMineClasses : bubbleRowTheirsClasses)}>
      <div
        className={cn(
          bubbleClasses,
          mine ? bubbleMineClasses : bubbleTheirsClasses,
        )}
      >
        <span className="sr-only">{mine ? "You" : peerName} said at </span>
        <span className={bodyClasses}>{message.text}</span>

        <span className={cn(metaClasses, mine ? metaClassesMine : metaClassesTheirs)}>
          <time dateTime={message.timestamp} className="text-xs font-bold">
            {message.timestamp}
          </time>
          {mine ? (
            <span className="sr-only">{isRead ? "Read" : "Sent"}</span>
          ) : null}
          {mine ? (
            isRead ? (
              <CheckCheck className="size-3 text-info-300" aria-hidden="true" />
            ) : (
              <Check className="size-3 text-white/70" aria-hidden="true" />
            )
          ) : null}
        </span>
      </div>
    </li>
  );
}
/** ################################ /COMPONENT ############################# */
