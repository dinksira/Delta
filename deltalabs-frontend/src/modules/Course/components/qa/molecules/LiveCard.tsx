/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { Wifi, CheckCircle2 } from "lucide-react";
import { cx } from "@/components/theme/utils";
import { Typography } from "@/components/theme";
import Image from "next/image";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface LiveCardProps {
  title: string;
  authorName: string;
  invitedLabel: string;
  isLive?: boolean;
  viewerCount?: number;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * LiveCard Molecule
 * Displays a live session preview with author info and join button.
 */
export const LiveCard: React.FC<LiveCardProps> = ({ 
  title, 
  authorName, 
  invitedLabel,
  isLive = false,
  viewerCount = 0
}) => {
  return (
    <div className="bg-white rounded-[24px] p-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-border-subtle/30 flex flex-col gap-6 transition-all duration-300 hover:shadow-[0_10px_40px_rgba(0,0,0,0.06)] hover:-translate-y-1">
      <Typography className="text-[28px] font-black text-text-primary leading-tight">
        {title}
      </Typography>

      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-full overflow-hidden border-2 border-primary-100 shrink-0">
          <Image src="/biology_neural_network_hero.png" alt={authorName} width={44} height={44} className="object-cover" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <Typography className="text-[14px] font-bold text-text-primary">
              {authorName}
            </Typography>
            <CheckCircle2 size={16} className="text-green-500 fill-green-50" />
            <Typography className="text-[13px] text-text-tertiary ml-2">
              Roadmap
            </Typography>
          </div>
          <Typography className="text-[13px] text-text-tertiary">
            {invitedLabel}
          </Typography>
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <button className="flex items-center gap-3 h-12 px-8 rounded-2xl bg-primary-900 text-white font-bold transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-primary-900/10">
          <Wifi size={20} />
          <span>{isLive ? "Live" : "Join"}</span>
        </button>

        <div className="flex items-center gap-2">
          <div className={cx(
            "h-2 w-2 rounded-full",
            viewerCount > 0 ? "bg-orange-500" : "bg-text-tertiary"
          )} />
          <Typography className="text-[14px] font-medium text-text-tertiary">
            {viewerCount > 0 ? `${viewerCount} watching` : "No one is here"}
          </Typography>
        </div>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
