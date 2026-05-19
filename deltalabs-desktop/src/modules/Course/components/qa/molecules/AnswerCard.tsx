/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  ChevronUp, 
  ChevronDown,
  Gift
} from "lucide-react";
import { Typography } from "@/components/theme";
import Image from "next/image";
import type { QAAnswer } from "../../../data/qaMockData";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface AnswerCardProps {
  answer: QAAnswer;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * AnswerCard Molecule
 * A modern, clean card for displaying community answers.
 */
export const AnswerCard: React.FC<AnswerCardProps> = ({ answer }) => {
  return (
    <div className="relative bg-white pl-4 py-4 border-b border-border-subtle group transition-all duration-200 hover:bg-surface-secondary/20">
      {/* Left Blue Accent Line */}
      <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-primary-500 rounded-r-full" />

      {/* 1. Top Row */}
      <div className="flex items-center gap-3 mb-3">
        {/* Avatar */}
        <div className="h-10 w-10 rounded-full bg-black overflow-hidden flex items-center justify-center border border-border-subtle shrink-0">
          <Image src="/biology_neural_network_hero.png" alt="author" width={40} height={40} className="object-cover" />
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-[14px] font-medium text-text-tertiary">
            Answer
          </span>
          <div className="flex items-center gap-2">
            <div className="flex flex-col -gap-1">
              <ChevronUp className="h-3 w-3 text-text-tertiary cursor-pointer hover:text-primary-600" />
              <ChevronDown className="h-3 w-3 text-text-tertiary cursor-pointer hover:text-primary-600" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[13px] font-bold text-text-secondary">
                {answer.voteCount}
              </span>
              <span className="text-[12px] text-text-tertiary">
                votes
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Answer Body Text */}
      <div className="mb-6 pr-4">
        <Typography className="text-[14px] leading-[1.6] text-text-secondary font-medium">
          You are the operator of a junction <span className="font-bold">and you</span> hear a Git branch coming. You have no idea which way it is supposed to go. You stop the train to <span className="font-bold">ask the</span> driver which direction they want. And then you set the switch appropriately to open them.
        </Typography>
      </div>

      {/* 3. Bottom Action Bar */}
      <div className="flex items-center justify-between pr-4">
        <div className="flex items-center gap-4">
          <button className="text-[12px] font-bold text-[#5C8D9F] hover:underline">
            See Comments
          </button>
          <button className="text-[12px] font-bold text-[#5C8D9F] hover:underline">
            Add a Comment
          </button>
          <button className="flex items-center gap-1.5 text-[12px] font-bold text-text-tertiary hover:text-primary-600 transition-colors">
            <div className="h-6 w-6 bg-primary-800 rounded-[4px] flex items-center justify-center text-white">
              <Gift className="h-4 w-4" />
            </div>
            <span className="text-[11px]">Send Gift</span>
          </button>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button className="text-[12px] font-bold text-[#5C8D9F] hover:underline">
              Report
            </button>
            <button className="text-[12px] font-bold text-[#5C8D9F] hover:underline">
              Share
            </button>
            <button className="text-[12px] font-black text-primary-900 hover:underline">
              Follow
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full overflow-hidden border border-border-subtle bg-black">
              <Image src="/biology_neural_network_hero.png" alt="author small" width={24} height={24} className="object-cover" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-bold text-text-secondary">
                {answer.author.name}
              </span>
              <span className="text-[11px] text-text-tertiary">
                Answered {answer.answeredAt}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
