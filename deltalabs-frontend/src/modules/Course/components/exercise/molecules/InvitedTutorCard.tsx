/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** InvitedTutorCard Molecule: Tracks status of tutor invitations. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { Star } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface InvitedTutorCardProps {
  name: string;
  organization: string;
  subject: string;
  rating: number;
  avatar: string;
  status: "pending" | "Accepted";
  topic: string;
  onMessage?: () => void;
  className?: string;
}

export const InvitedTutorCard: React.FC<InvitedTutorCardProps> = ({
  name,
  organization,
  subject,
  rating,
  avatar,
  status,
  topic,
  onMessage,
  className,
}) => {
  return (
    <div className={cx("flex h-auto sm:h-[180px] w-full rounded-[24px] bg-[#E2E8F0]/40 border border-white/40 shadow-sm overflow-hidden", className)}>
      {/* Left: Avatar (40%) */}
      <div className="relative w-[40%] h-full shrink-0">
        <Image src={avatar} alt={name} fill className="object-cover" />
      </div>

      {/* Right: Details (60%) */}
      <div className="flex-1 flex flex-col p-5 justify-between relative">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Typography className="text-[17px] font-black text-[#114B5F]">{name}</Typography>
              <div className="h-4 w-[1.5px] bg-[#114B5F]/30" />
              <Typography className="text-[12px] font-bold text-[#64748B]">{organization}</Typography>
            </div>
            <Typography className="text-[12px] font-bold text-[#4A7280]">{subject}</Typography>
            <div className="flex items-center gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={12} className={cx(i < Math.floor(rating) ? "fill-[#114B5F] text-[#114B5F]" : "text-[#114B5F]/20")} />
              ))}
            </div>
          </div>

          <div className="flex flex-col items-end">
            <Typography className={cx(
              "text-[12px] font-black italic",
              status === "pending" ? "text-[#FFAB40]" : "text-[#66BB6A]"
            )}>
              {status}
            </Typography>
            <Typography className="text-[11px] font-bold text-[#4A7280]">
              {topic}
            </Typography>
          </div>
        </div>

        <div className="mt-auto">
          <Button 
            onClick={onMessage}
            className="!bg-[#114B5F] !text-white rounded-lg px-8 h-10 text-[13px] font-bold border-none"
          >
            Message
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InvitedTutorCard;
/** ################################ /COMPONENT ############################# */
