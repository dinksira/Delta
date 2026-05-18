/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** TutorCard Molecule: Displays a tutor profile for browsing/inviting. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { MessageCircle, Star } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface TutorCardProps {
  name: string;
  organization: string;
  subject: string;
  rating: number;
  avatar: string;
  onInvite?: () => void;
  onMessage?: () => void;
  className?: string;
}

export const TutorCard: React.FC<TutorCardProps> = ({
  name,
  organization,
  subject,
  rating,
  avatar,
  onInvite,
  onMessage,
  className,
}) => {
  return (
    <div className={cx("flex h-auto sm:h-[180px] w-full rounded-[24px] bg-[#E2E8F0]/40 border border-white/40 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300", className)}>
      {/* Left: Avatar (40%) */}
      <div className="relative w-[40%] h-full shrink-0 overflow-hidden">
        <Image 
          src={avatar} 
          alt={name} 
          fill 
          className="object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>

      {/* Right: Details (60%) */}
      <div className="flex-1 flex flex-col p-5 justify-between relative">
        <div className="space-y-1">
          {/* Title & Organization */}
          <div className="flex items-center gap-2">
            <Typography className="text-[17px] font-black text-[#114B5F] leading-tight">
              {name}
            </Typography>
            <div className="h-4 w-[1.5px] bg-[#114B5F]/30" />
            <Typography className="text-[12px] font-bold text-[#64748B]">
              {organization}
            </Typography>
          </div>

          <Typography className="text-[13px] font-bold text-[#4A7280]">
            {subject}
          </Typography>

          {/* Rating */}
          <div className="flex items-center gap-0.5 pt-1">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                size={14} 
                className={cx(i < Math.floor(rating) ? "fill-[#114B5F] text-[#114B5F]" : "text-[#114B5F]/20")} 
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-auto">
          <Button 
            onClick={onInvite}
            className="!bg-[#114B5F] !text-white rounded-lg px-8 h-10 text-[13px] font-bold border-none hover:brightness-110 active:scale-95 transition-all"
          >
            Invite
          </Button>

          <button 
            onClick={onMessage}
            className="p-2.5 rounded-lg border border-[#114B5F]/20 text-[#114B5F] hover:bg-[#114B5F]/5 transition-colors"
          >
            <MessageCircle size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorCard;
/** ################################ /COMPONENT ############################# */
