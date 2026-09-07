/**
 * StageChatOverlay — stacked translucent chat comment pills over the live
 * stage bottom-left corner. Renders only the most recent few messages, each as
 * a dark pill with a mini avatar, username, text, and an optional emoji.
 *
 * @example
 * ```tsx
 * <StageChatOverlay messages={chat} />
 * ```
 */

import { Avatar } from "@/components/atoms/Avatar";
import type { LiveChatMessage } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface StageChatOverlayProps {
  messages: LiveChatMessage[];
  className?: string;
}

/** Keep the overlay legible — only the freshest pills stay on screen. */
const MAX_VISIBLE_MESSAGES = 3;

export function StageChatOverlay({ messages, className }: Readonly<StageChatOverlayProps>) {
  const visible = messages.slice(-MAX_VISIBLE_MESSAGES);

  return (
    <div className={cn("flex max-w-xs flex-col items-start gap-2", className)} aria-live="polite">
      {visible.map((message) => (
        <div
          key={message.id}
          className="flex items-center gap-2 rounded-full bg-primary-900/70 px-3 py-1.5 text-white shadow-sm backdrop-blur-sm"
        >
          <Avatar name={message.username} src={message.avatarUrl} size="xs" />
          <p className="min-w-0 truncate text-xs leading-tight">
            <span className="font-bold">{message.username}</span>{" "}
            <span className="text-white/90">{message.text}</span>
          </p>
          {message.emoji ? <span className="text-sm">{message.emoji}</span> : null}
        </div>
      ))}
    </div>
  );
}

export default StageChatOverlay;