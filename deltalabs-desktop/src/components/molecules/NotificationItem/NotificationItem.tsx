import React from 'react';
import { MessageSquare } from 'lucide-react';
import { Typography } from '@/components/theme';
import { cx } from '@/components/theme/utils';

export interface NotificationItemProps {
  id: string;
  title: string;
  subtitle: string;
  isRead?: boolean;
  buttonLabel?: string;
  onAction?: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  title,
  subtitle,
  isRead = false,
  buttonLabel = 'Go to resource',
  onAction,
}) => {
  return (
    <div className={cx(
      "flex items-center gap-4 px-6 py-5 rounded-xl transition-all duration-300",
      isRead 
        ? "bg-white border border-[#174A5F]/10" 
        : "bg-[#F1F5F9]"
    )}>
      {/* Icon Area */}
      <div className="shrink-0 w-12 h-12 rounded-xl bg-white border border-[#174A5F]/10 flex items-center justify-center relative">
        <MessageSquare className="h-5 w-5 text-[#174A5F]" />
        {!isRead && (
          <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#174A5F] rounded-full border-2 border-white" />
        )}
      </div>

      {/* Text Area */}
      <div className="flex-1 min-w-0">
        <Typography className="text-[15px] font-bold text-[#174A5F]">
          {title}
        </Typography>
        <Typography className="text-[13px] font-medium text-[#64748B]">
          {subtitle}
        </Typography>
      </div>

      {/* Button Area */}
      <button 
        onClick={onAction}
        className="shrink-0 h-10 px-6 bg-[#174A5F] text-white rounded-lg text-[13px] font-bold hover:bg-[#133e50] transition-colors"
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default NotificationItem;
