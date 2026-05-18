import React from 'react';
import Image from 'next/image';
import { Typography } from '@/components/theme';
import { cx } from '@/components/theme/utils';

export interface ChatMessageProps {
  id: string;
  text?: string;
  emojiText?: string;
  timestamp: string;
  senderName: string;
  senderAvatar: string;
  isSelf?: boolean;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  text,
  emojiText,
  timestamp,
  senderAvatar,
  isSelf = false,
}) => {
  return (
    <div className={cx(
      "flex gap-3 max-w-[80%]",
      isSelf ? "flex-row-reverse ml-auto" : "mr-auto"
    )}>
      {/* Avatar */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 overflow-hidden relative self-end">
        {senderAvatar && <Image src={senderAvatar} alt="Avatar" fill className="object-cover" />}
      </div>

      {/* Bubble & Timestamp */}
      <div className={cx("space-y-1.5", isSelf ? "items-end" : "items-start")}>
        <div className={cx(
          "px-6 py-4 rounded-[20px] transition-all duration-300 shadow-sm",
          isSelf 
            ? "bg-[#174A5F] text-white rounded-tr-none" 
            : "bg-[#F1F5F9] text-[#174A5F] rounded-tl-none"
        )}>
          {text && (
            <Typography className="text-sm font-medium leading-relaxed">
              {text}
            </Typography>
          )}
          {emojiText && (
            <div className="text-2xl tracking-widest pt-1">
              {emojiText}
            </div>
          )}
        </div>
        <Typography className="text-[10px] font-bold text-[#174A5F]/40 px-1">
          {timestamp}
        </Typography>
      </div>
    </div>
  );
};

export default ChatMessage;
