"use client";

import React from "react";
import Image from "next/image";
import { Share2, Star } from "lucide-react";

export interface CommunityCourseCardProps {
  title: string;
  university: string;
  imageSrc: string;
}

export const CommunityCourseCard: React.FC<CommunityCourseCardProps> = ({
  title,
  university,
  imageSrc,
}) => {
  return (
    <div className="flex w-full h-[220px] bg-[#EEF2F4] rounded-2xl overflow-hidden relative shadow-sm">
      {/* Left Image Section */}
      <div className="w-[200px] h-full relative flex-shrink-0 bg-white">
        <Image
          src={imageSrc}
          alt={title}
          fill
          className="object-cover mix-blend-multiply"
        />
      </div>

      {/* Content Section */}
      <div className="flex-1 px-6 py-6 flex flex-col justify-between relative">
        <button className="absolute top-6 right-6 text-[#1F4156] hover:text-opacity-80 transition-colors">
          <Share2 className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-[#1F4156]">{title}</h2>
            <div className="w-px h-5 bg-gray-300" />
            <span className="text-sm text-[#1F4156]">{university}</span>
          </div>

          <div className="mt-4">
            <span className="text-[13px] text-[#1F4156] block mb-1 font-medium">Rating</span>
            <div className="flex items-center gap-1 text-[#1F4156]">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 text-gray-400" />
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between mt-auto">
          <button className="bg-[#1F4156] text-white px-8 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
            Enroll
          </button>
          
          <span className="text-xs text-[#1F4156] font-medium mr-4">
            Available Offline
          </span>
        </div>
      </div>
    </div>
  );
};
