"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { SuperCourseSearch } from "../components/SuperCourseSearch";
import { PersonalCourseCard } from "../components/PersonalCourseCard";
import { CommunityCourseCard } from "../components/CommunityCourseCard";

type Tab = "create" | "personal" | "community" | "temporary";

export const SuperCourseView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("create");

  return (
    <div className="min-h-screen bg-white">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-10 py-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/features/course" className="text-gray-400 hover:text-gray-600 transition-colors">
            Course
          </Link>
          <span className="text-gray-300">{">"}</span>
          <span className="text-[#1F4156] font-medium">Super Course</span>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1F4156] text-white hover:bg-opacity-90 transition-colors shadow-sm">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex justify-center gap-6 mt-4">
        <button
          onClick={() => setActiveTab("create")}
          className={`px-4 py-2 rounded-lg text-[13px] transition-colors ${
            activeTab === "create"
              ? "bg-[#F0F2F4] text-[#1F4156] font-bold"
              : "text-gray-500 hover:text-[#1F4156] font-medium"
          }`}
        >
          Create Super Course
        </button>
        <button
          onClick={() => setActiveTab("personal")}
          className={`px-4 py-2 rounded-lg text-[13px] transition-colors ${
            activeTab === "personal"
              ? "bg-[#F0F2F4] text-[#1F4156] font-bold"
              : "text-gray-500 hover:text-[#1F4156] font-medium"
          }`}
        >
          Personal Super Course
        </button>
        <button
          onClick={() => setActiveTab("community")}
          className={`px-4 py-2 rounded-lg text-[13px] transition-colors ${
            activeTab === "community"
              ? "bg-[#F0F2F4] text-[#1F4156] font-bold"
              : "text-gray-500 hover:text-[#1F4156] font-medium"
          }`}
        >
          Community Super Course
        </button>
        <button
          onClick={() => setActiveTab("temporary")}
          className={`px-4 py-2 rounded-lg text-[13px] transition-colors ${
            activeTab === "temporary"
              ? "bg-[#F0F2F4] text-[#1F4156] font-bold"
              : "text-gray-500 hover:text-[#1F4156] font-medium"
          }`}
        >
          Temporary Super Course
        </button>
      </div>

      {/* Content Area */}
      <div className="max-w-[1200px] mx-auto mt-10 px-6">
        
        {activeTab === "create" && (
          <div className="mt-16">
            <button className="w-[160px] h-[160px] rounded-2xl border-2 border-dashed border-[#1F4156] border-opacity-30 flex items-center justify-center hover:bg-gray-50 transition-colors">
               <div className="w-[70px] h-[70px] bg-[#1F4156] rounded-full flex items-center justify-center" style={{ borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%" }}>
                 <Plus className="w-8 h-8 text-white" />
               </div>
            </button>
          </div>
        )}

        {activeTab === "personal" && (
          <div>
            <SuperCourseSearch />
            <div className="flex flex-col gap-6">
              <PersonalCourseCard 
                title="Biology"
                university="Haramaya University"
                progressPercent={10}
                currentTopic="Introduction to Quantum Physics"
                currentDuration="Video 75 min"
                imageSrc="/images/courses/biology.png"
              />
              <PersonalCourseCard 
                title="Biology"
                university="A.A & ASTU"
                progressPercent={10}
                currentTopic="Introduction to Quantum Physics"
                currentDuration="Video 75 min"
                imageSrc="/images/courses/biology.png"
                isSuperCourse={true}
              />
            </div>
          </div>
        )}

        {activeTab === "community" && (
          <div>
            <SuperCourseSearch />
            <div className="grid grid-cols-2 gap-6">
              <CommunityCourseCard
                title="Chemistry"
                university="Haramaya & Addis"
                imageSrc="/images/courses/chemistry.png"
              />
              <CommunityCourseCard
                title="Chemistry"
                university="Haramaya & Addis"
                imageSrc="/images/courses/chemistry.png"
              />
            </div>
          </div>
        )}

        {activeTab === "temporary" && (
          <div className="flex flex-col items-center justify-center mt-20 text-gray-400">
            No temporary super courses available.
          </div>
        )}
        
      </div>
    </div>
  );
};
