/**
 * CommunityContactItem
 * Displays a single community contact with name, handle, status, and online indicator.
 *
 * @example
 * ```tsx
 * <CommunityContactItem
 *   id="1"
 *   name="John Doe"
 *   handle="@johndoe"
 *   statusText="Hello, how are you?"
 *   onlineStatus="Online"
 *   isActive
 * />
 * ```
 */

import React from 'react';
import type { CommunityContactItemProps } from './CommunityContactItem.types';
import { Typography } from '@/components/theme';

// ============================================================================
// COMPONENT
// ============================================================================

export const CommunityContactItem: React.FC<CommunityContactItemProps> = ({
  name,
  handle,
  avatar,
  statusText,
  onlineStatus,
  isActive = false,
  onClick,
  className = '',
  ...props
}) => {
  const isOnline = onlineStatus?.toLowerCase() === 'online';
  
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer text-left
        ${isActive 
          ? 'bg-surface-muted/50 border-r-2 border-primary-900' 
          : 'hover:bg-surface-muted/30'
        }
        ${className}
      `}
      {...props}
    >
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-surface-elevated overflow-hidden relative">
        {avatar ? (
          <img 
            src={avatar} 
            alt={name} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary font-bold">
            {name.charAt(0)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-sm font-bold text-text-primary truncate">
            {name}
          </Typography>
          <Typography className="text-xs font-medium text-text-secondary shrink-0">
            {handle}
          </Typography>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <Typography className="text-xs font-medium text-text-secondary truncate">
            {statusText}
          </Typography>
          {onlineStatus && (
            <div className="flex items-center gap-1.5 shrink-0">
              {isOnline && (
                <div className="w-2 h-2 rounded-full bg-success-500" />
              )}
              <Typography className={`text-[10px] font-bold ${
                isOnline ? 'text-success-500' : 'text-text-secondary'
              }`}>
                {onlineStatus}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </button>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityContactItem;
