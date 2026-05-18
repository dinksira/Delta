/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { MessageSquareText } from "lucide-react";
import { cx } from "@/components/theme/utils";
import { Typography, Button } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface NotificationCardProps {
  title: string;
  description: string;
  isUnread?: boolean;
  onGoToQuestion?: () => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * NotificationCard Molecule
 * Displays a single notification item with an action button.
 */
export const NotificationCard: React.FC<NotificationCardProps> = ({ 
  title, 
  description, 
  isUnread = false,
  onGoToQuestion 
}) => {
  return (
    <div className={cx(
      "flex items-center justify-between p-5 rounded-xl border transition-all duration-200",
      isUnread 
        ? "bg-[#E9F1F3] border-[#D1E1E5]" 
        : "bg-white border-border-subtle"
    )}>
      <div className="flex items-center gap-4">
        {/* Icon with notification dot */}
        <div className="relative h-11 w-11 rounded-lg border border-border-subtle bg-white flex items-center justify-center text-[#5C8D9F] shrink-0">
          <MessageSquareText size={22} />
          {isUnread && (
            <div className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-600" />
          )}
        </div>
        
        <div className="flex flex-col gap-0.5">
          <Typography className="text-[15px] font-bold text-primary-900 leading-tight">
            {title}
          </Typography>
          <Typography className="text-[13px] text-text-tertiary">
            {description}
          </Typography>
        </div>
      </div>

      <Button 
        onClick={onGoToQuestion}
        className="h-10 px-6 rounded-lg !bg-primary-900 !text-white border-none font-bold text-[13px] hover:brightness-110 shadow-sm"
      >
        Go to question
      </Button>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
