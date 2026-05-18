import React from 'react';
import Image from 'next/image';
import { Typography } from '@/components/theme';
import { cx } from '@/components/theme/utils';

export interface CommunityContactItemProps {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  statusText: string;
  onlineStatus?: 'online' | string; // 'Online' or date like 'Oct 12'
  isActive?: boolean;
}

export const CommunityContactItem: React.FC<CommunityContactItemProps> = ({
  name,
  handle,
  avatar,
  statusText,
  onlineStatus,
  isActive = false,
}) => {
  return (
    <div className={cx(
      "flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer",
      isActive ? "bg-[#174A5F]/5" : "hover:bg-[#174A5F]/5"
    )}>
      {/* Avatar */}
      <div className="shrink-0 w-10 h-10 rounded-full bg-slate-200 overflow-hidden relative">
        {avatar && <Image src={avatar} alt={name} fill className="object-cover" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <Typography className="text-[13px] font-bold text-[#174A5F] truncate">
            {name}
          </Typography>
          <Typography className="text-[10px] font-medium text-[#64748B] shrink-0">
            {handle}
          </Typography>
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          <Typography className="text-[11px] font-medium text-[#64748B] truncate">
            {statusText}
          </Typography>
          {onlineStatus && (
            <div className="flex items-center gap-1.5 shrink-0">
              {onlineStatus.toLowerCase() === 'online' && (
                <div className="w-2 h-2 rounded-full bg-[#4ADE80]" />
              )}
              <Typography className={cx(
                "text-[9px] font-bold",
                onlineStatus.toLowerCase() === 'online' ? "text-[#4ADE80]" : "text-[#64748B]"
              )}>
                {onlineStatus}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommunityContactItem;
