/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ReminderItem Molecule: Compact item for the reminder sidebar. */
import React from "react";
import Image from "next/image";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";

export interface ReminderItemProps {
  userAvatar: string;
  userName: string;
  title: string;
  isActive?: boolean;
  className?: string;
}

export const ReminderItem: React.FC<ReminderItemProps> = ({
  userAvatar,
  userName,
  title,
  isActive = false,
  className,
}) => {
  return (
    <div className={cx("flex flex-col gap-1 py-3 group cursor-pointer", className)}>
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full overflow-hidden bg-slate-200 shrink-0">
          <Image src={userAvatar} alt={userName} width={24} height={24} className="object-cover" />
        </div>
        <Typography className="text-[12px] font-bold text-[#64748B] group-hover:text-[#114B5F] transition-colors">
          {userName}
        </Typography>
        {isActive && (
          <div className="w-2 h-2 rounded-full bg-[#114B5F]" />
        )}
      </div>
      <Typography className="text-[13px] font-black text-[#111827] line-clamp-2 leading-snug">
        {title}
      </Typography>
    </div>
  );
};

export default ReminderItem;
/** ################################ /COMPONENT ############################# */
