"use client";

import React from "react";
import { Search, ArrowUpDown, SlidersHorizontal } from "lucide-react";

export const SuperCourseSearch: React.FC = () => {
  return (
    <div className="flex justify-center w-full mt-10 mb-8">
      <div className="flex items-center w-[500px] h-12 bg-[#F8F9FA] rounded-[10px] border border-gray-200 px-4 shadow-sm">
        <Search className="w-5 h-5 text-gray-500 mr-3" />
        <input
          type="text"
          placeholder="Search"
          className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
        />
        <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
          <button className="text-gray-700 hover:text-primary-800 transition-colors">
            <ArrowUpDown className="w-5 h-5" />
          </button>
          <button className="text-gray-700 hover:text-primary-800 transition-colors">
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
