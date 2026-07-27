/**
 * CommunityMessageItem
 * Displays a single chat message with sender info, message bubble, and timestamp.
 *
 * @example
 * ```tsx
 * <CommunityMessageItem
 *   id="1"
 *   content="Hello, how are you?"
 *   timestamp="10:30 AM"
 *   isSender={false}
 *   senderName="John Doe"
 * />
 * ```
 */

import React from 'react';
import type { CommunityMessageItemProps } from './CommunityMessageItem.types';
import { Typography } from '@/components/theme';

// ============================================================================
// COMPONENT
// ============================================================================

export const CommunityMessageItem: React.FC<CommunityMessageItemProps> = ({
  content,
  timestamp,
  isSender,
  senderName,
  senderAvatar,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        flex items-end gap-2
        ${isSender ? 'flex-row-reverse' : 'flex-row'}
        ${className}
      `}
      {...props}
    >
      {/* Avatar (only for non-sender) */}
      {!isSender && (
        <div className="shrink-0 w-8 h-8 rounded-full bg-surface-elevated overflow-hidden">
          {senderAvatar ? (
            <img
              src={senderAvatar}
              alt={senderName || 'Sender'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-secondary text-xs font-bold">
              {senderName?.charAt(0) || 'U'}
            </div>
          )}
        </div>
      )}

      {/* Message */}
      <div className={`
        max-w-[70%] flex flex-col gap-1
        ${isSender ? 'items-end' : 'items-start'}
      `}>
        <div className={`
          px-4 py-2 rounded-2xl
          ${isSender 
            ? 'bg-primary-900 text-white rounded-br-sm' 
            : 'bg-surface-muted text-text-primary rounded-bl-sm'
          }
        `}>
          <Typography className="text-sm">{content}</Typography>
        </div>
        <Typography className="text-[10px] text-text-muted">
          {timestamp}
        </Typography>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityMessageItem;
