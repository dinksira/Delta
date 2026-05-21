/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { FileText, ClipboardCheck } from "lucide-react";
import { Typography, Button } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface ExerciseCardProps {
  type: 'exercise' | 'test';
  title: string;
  description: string;
  isLive?: boolean;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * ExerciseCard Molecule
 * A wide, horizontal card for selecting an exercise or test.
 */
export const ExerciseCard: React.FC<ExerciseCardProps> = ({ 
  type, 
  title, 
  description,
  isLive = false 
}) => {
  const Icon = type === 'exercise' ? FileText : ClipboardCheck;

  return (
    <div className="relative flex items-center gap-8 p-10 bg-white border border-border-subtle rounded-xl w-full max-w-[580px] shadow-sm hover:shadow-md transition-all duration-300">
      {/* Live Badge with Dot */}
      {isLive && (
        <div className="absolute top-6 right-6 bg-[#D0021B] text-white text-[11px] font-black px-4 py-1.5 rounded-lg uppercase tracking-wider flex items-center gap-2">
          <span>Live</span>
          <div className="h-2.5 w-2.5 rounded-full bg-white shadow-sm animate-pulse" />
        </div>
      )}

      {/* ZONE 1: Icon Area */}
      <div className="text-primary-900 shrink-0">
        <Icon size={48} strokeWidth={1.2} />
      </div>

      {/* ZONE 2: Content Area */}
      <div className="flex flex-col gap-1 flex-1 pr-28">
        <Typography className="text-[20px] font-black text-primary-900">
          {title}
        </Typography>
        <Typography className="text-[13px] text-text-tertiary leading-relaxed line-clamp-2">
          {description}
        </Typography>
      </div>

      {/* ZONE 3: Action Area (Absolute positioned to bottom right) */}
      <div className="absolute bottom-8 right-8">
        <Button className="h-10 px-8 rounded-lg !bg-primary-900 !text-white border-none font-black text-sm shadow-md transition-transform active:scale-95">
          Continue
        </Button>
      </div>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
