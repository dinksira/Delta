/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ResourceCard Molecule: Displays an individual resource entry (book, slide, etc). */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { Star, MessageSquare, Bookmark } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface ResourceCardProps {
  title: string;
  author: string;
  authorAvatar?: string;
  rating: number;
  thumbnail: string;
  actionLabel?: "Read" | "Watch";
  className?: string;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({
  title,
  author,
  authorAvatar = "https://i.pravatar.cc/150?u=50",
  rating,
  thumbnail,
  actionLabel = "Read",
  className,
}) => {
  return (
    <div className={cx("flex flex-col gap-4 w-full", className)}>
      {/* Visual Area */}
      <div className="flex flex-col rounded-xl overflow-hidden border border-[#E2E8F0]/40 shadow-sm bg-white">
        <div className="relative aspect-[3/4] w-full p-4">
          <div className="relative w-full h-full shadow-md">
            <Image src={thumbnail} alt={title} fill className="object-cover" />
          </div>
        </div>
        
        <Button className="!bg-[#114B5F] !text-white rounded-none h-12 text-[14px] font-black border-none hover:brightness-110 active:scale-[0.98] transition-all">
          {actionLabel}
        </Button>
      </div>

      {/* Content Area */}
      <div className="flex flex-col gap-1.5">
        <Typography className="text-[16px] font-black text-[#114B5F] line-clamp-1">
          {title}
        </Typography>
        
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Typography className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Rate</Typography>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star 
                  key={s} 
                  size={12} 
                  className={cx(s <= rating ? "fill-[#114B5F] text-[#114B5F]" : "text-[#E2E8F0]")} 
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-[#114B5F]">
            <MessageSquare size={18} className="cursor-pointer hover:scale-110 transition-transform" />
            <Bookmark size={18} className="cursor-pointer hover:scale-110 transition-transform" />
          </div>
        </div>

        {/* Author Row */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-5 h-5 rounded-full overflow-hidden border border-[#E2E8F0]">
            <Image src={authorAvatar} alt={author} width={20} height={20} className="object-cover" />
          </div>
          <Typography className="text-[12px] font-bold text-[#64748B]">{author}</Typography>
        </div>
      </div>
    </div>
  );
};

export default ResourceCard;
/** ################################ /COMPONENT ############################# */
