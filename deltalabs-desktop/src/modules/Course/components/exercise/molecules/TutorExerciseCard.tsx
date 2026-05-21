/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** TutorExerciseCard Molecule: Displays an exercise set by a tutor. */
import React from "react";
import Image from "next/image";
import { Typography, Button } from "@/components/theme";
import { Clock, Calendar } from "lucide-react";
import { cx } from "@/components/theme/utils";

export interface TutorExerciseCardProps {
  title: string;
  tutorName: string;
  questionCount: number;
  duration: string;
  type: string;
  thumbnail: string;
  difficulty: string;
  onStart?: () => void;
  onSchedule?: () => void;
  onTakeWithFriend?: () => void;
  className?: string;
}

export const TutorExerciseCard: React.FC<TutorExerciseCardProps> = ({
  title,
  tutorName,
  questionCount,
  duration,
  type,
  thumbnail,
  difficulty,
  onStart,
  onSchedule,
  onTakeWithFriend,
  className,
}) => {
  return (
    <div className={cx("flex flex-col sm:flex-row h-auto sm:h-[180px] w-full rounded-[24px] bg-[#E2E8F0]/40 border border-white/40 shadow-sm overflow-hidden", className)}>
      {/* Left: Thumbnail */}
      <div className="relative w-full sm:w-[40%] h-40 sm:h-full shrink-0">
        <Image src={thumbnail} alt={title} fill className="object-cover" />
      </div>

      {/* Right: Details */}
      <div className="flex-1 flex flex-col p-5 justify-between relative">
        {/* Difficulty Badge */}
        <div className="absolute top-4 right-4 px-3 py-1 rounded-md bg-[#81C784] text-white text-[10px] font-black uppercase">
          {difficulty}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Typography className="text-[17px] font-black text-[#114B5F]">{title}</Typography>
            <div className="h-4 w-[1.5px] bg-[#114B5F]/30" />
            <Typography className="text-[12px] font-bold text-[#64748B]">Set be {tutorName}</Typography>
          </div>

          <div className="flex items-start gap-12">
            <div className="space-y-1.5">
              <Typography className="text-[13px] font-bold text-[#4A7280]">{questionCount} questions</Typography>
              <Typography className="text-[13px] font-bold text-[#4A7280]">{type}</Typography>
            </div>
            <div className="flex items-center gap-2 text-[#114B5F]">
              <Clock size={16} />
              <Typography className="text-[13px] font-bold">{duration}</Typography>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between mt-auto">
          <div className="flex items-center gap-4">
            <Button onClick={onStart} className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none">
              Start Exercise
            </Button>
            <button onClick={onSchedule} className="p-2.5 rounded-lg border border-[#114B5F]/20 text-[#114B5F] hover:bg-[#114B5F]/5">
              <Calendar size={18} />
            </button>
          </div>
          
          <button onClick={onTakeWithFriend} className="text-[11px] font-bold text-[#4A7280] underline underline-offset-2 hover:text-[#114B5F]">
            Take with friend
          </button>
        </div>
      </div>
    </div>
  );
};

export default TutorExerciseCard;
/** ################################ /COMPONENT ############################# */
