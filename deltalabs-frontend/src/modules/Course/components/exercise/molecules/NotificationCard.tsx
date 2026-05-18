/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** NotificationCard Molecule: Displays an individual notification item. */
import React from "react";
import { Typography, Button } from "@/components/theme";
import { FileText } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface NotificationCardProps {
  title: string;
  subtitle: string;
  isUnread?: boolean;
  onAction?: () => void;
  className?: string;
}

export const NotificationCard: React.FC<NotificationCardProps> = ({
  title,
  subtitle,
  isUnread = false,
  onAction,
  className,
}) => {
  return (
    <div 
      className={cx(
        "flex items-center justify-between p-6 rounded-[24px] border border-[#E2E8F0]/40 transition-all duration-300",
        isUnread ? "bg-[#E2E8F0]/40 shadow-sm" : "bg-white",
        className
      )}
    >
      <div className="flex items-center gap-5">
        {/* Stylized Icon */}
        <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-white border border-[#E2E8F0] shadow-sm">
          <FileText className="text-[#114B5F]" size={24} />
          {isUnread && (
            <div className="absolute top-[-2px] left-[-2px] w-3 h-3 rounded-full bg-[#114B5F] border-2 border-white" />
          )}
        </div>

        {/* Content */}
        <div className="flex flex-col">
          <Typography className="text-[17px] font-black text-[#114B5F] leading-tight">
            {title}
          </Typography>
          <Typography className="text-[13px] font-bold text-[#64748B]">
            {subtitle}
          </Typography>
        </div>
      </div>

      {/* Action */}
      <Button 
        onClick={onAction}
        className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-sm hover:brightness-110 active:scale-95 transition-all"
      >
        Go to exercise
      </Button>
    </div>
  );
};

export default NotificationCard;
/** ################################ /COMPONENT ############################# */
