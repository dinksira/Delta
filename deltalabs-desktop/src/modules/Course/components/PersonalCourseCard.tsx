"use client";

import React from "react";
import Image from "next/image";
import {
  LogOut,
  Users,
  CloudDownload,
  MessageSquareText,
  Share2,
  FileText,
  Flag,
  Pause,
  Star
} from "lucide-react";

export interface PersonalCourseCardProps {
  title: string;
  university: string;
  progressPercent: number;
  currentTopic: string;
  currentDuration: string;
  imageSrc: string;
  isSuperCourse?: boolean;
}

export const PersonalCourseCard: React.FC<PersonalCourseCardProps> = ({
  title,
  university,
  progressPercent,
  currentTopic,
  currentDuration,
  imageSrc,
  isSuperCourse = false,
}) => {
  return (
    <div className="flex w-full h-[220px] bg-[#EEF2F4] rounded-2xl overflow-hidden mb-6 relative shadow-sm">
      {/* Left Image Section */}
      <div className="w-[280px] h-full relative flex-shrink-0">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover"
        />
      </div>

      {/* Middle Content Section */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#1F4156]">{title}</h2>
            <div className="w-px h-5 bg-gray-300" />
            <span className="text-sm text-gray-500">{university}</span>
          </div>

          <div className="mt-3">
            <span className="text-[13px] text-gray-600 block mb-1">Rating</span>
            <div className="flex items-center gap-1 text-[#1F4156]">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="mt-4 max-w-[280px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[12px] text-gray-600 font-medium">Overall progress</span>
              <Pause className="w-3.5 h-3.5 text-[#1F4156] fill-current" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#1F4156] rounded-full" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs font-bold text-black">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex items-center gap-6 mt-4">
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <LogOut className="w-4 h-4" /> Unenroll
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <Users className="w-4 h-4" /> Take with a friend
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <CloudDownload className="w-4 h-4" /> Download
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            View Planner
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <MessageSquareText className="w-4 h-4" /> Message School
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-[320px] h-full flex flex-col p-5 pl-0 relative">
        <button className="absolute top-5 right-5 text-gray-500 hover:text-[#1F4156] transition-colors">
          <Share2 className="w-5 h-5" />
        </button>

        {isSuperCourse && (
          <div className="absolute top-1/2 -left-10 -translate-y-1/2 flex items-center gap-1.5 text-yellow-500 bg-[#EEF2F4] px-2">
             {/* Yellow Badge */}
             <div className="w-5 h-5 border-2 border-yellow-500 rounded flex items-center justify-center">
               <div className="w-2.5 h-1.5 border-b-2 border-r-2 border-yellow-500 transform rotate-45 mb-1" />
             </div>
             <span className="text-sm font-medium italic">Super course</span>
          </div>
        )}

        <div className="mt-2 flex items-start gap-3">
           <div className="mt-1 flex flex-col items-center">
             <span className="text-[10px] text-gray-500">Current</span>
             <FileText className="w-6 h-6 text-gray-500" />
           </div>
           <div>
             <a href="#" className="text-sm font-medium text-gray-500 underline hover:text-[#1F4156]">{currentTopic}</a>
             <div className="text-[11px] text-gray-400 mt-1">{currentDuration}</div>
           </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Flag className="w-5 h-5 text-green-500 fill-current" />
          <span className="text-sm font-bold text-green-500">Upcoming Deadline</span>
        </div>

        <div className="mt-auto self-end">
          <button className="bg-[#1F4156] text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
            Go to course
          </button>
        </div>
      </div>
    </div>
  );
};
