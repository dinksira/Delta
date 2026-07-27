"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  ArrowUpDown,
  Pencil,
  LogOut,
  Users,
  CloudUpload,
  MessageSquareText,
  Flag,
  FileText,
  Star,
  Pause,
  Trash2
} from "lucide-react";

interface OfflineCourseCardProps {
  title: string;
  university: string;
  progressPercent: number;
  downloadPercent: number;
  currentTopic: string;
  currentDuration: string;
  imageSrc: string;
}

const OfflineCourseCard: React.FC<OfflineCourseCardProps> = ({
  title,
  university,
  progressPercent,
  downloadPercent,
  currentTopic,
  currentDuration,
  imageSrc,
}) => {
  return (
    <div className="flex w-full h-[220px] bg-[#EEF2F4] rounded-2xl overflow-hidden mb-6 relative shadow-sm">
      {/* Left Image Section */}
      <div className="w-[220px] h-full relative flex-shrink-0">
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
            <span className="text-[13px] text-gray-600 block mb-1">Rate</span>
            <div className="flex items-center gap-1 text-[#1F4156]">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 text-gray-400" />
            </div>
          </div>

          <div className="mt-3 max-w-[260px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[11px] text-gray-600 font-medium">Overall progress</span>
              <Pause className="w-3 h-3 text-[#1F4156] fill-current" />
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
        <div className="flex items-center gap-5 mt-2">
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <LogOut className="w-4 h-4" /> Unroll
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <Users className="w-4 h-4" /> Take with a friend
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-[#1F4156] hover:opacity-80 transition-colors">
            <CloudUpload className="w-4 h-4 text-green-600" />
            <span className="text-green-600 font-bold">{downloadPercent}%</span> View Planner
          </button>
          <button className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
            <MessageSquareText className="w-4 h-4" /> Message School
          </button>
        </div>
      </div>

      {/* Right Section */}
      <div className="w-[280px] h-full flex flex-col p-5 pl-2 relative">
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="text-gray-300 hover:text-gray-500 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Green chip icon */}
        <div className="w-6 h-6 rounded bg-green-500 flex items-center justify-center mb-2 mt-1">
          <span className="text-white text-[10px] font-bold">↓</span>
        </div>

        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <span className="text-[9px] text-gray-400">Current</span>
            <FileText className="w-5 h-5 text-gray-400 mt-0.5" />
          </div>
          <div>
            <a href="#" className="text-[11px] font-medium text-gray-500 underline hover:text-[#1F4156]">
              {currentTopic}
            </a>
            <div className="text-[10px] text-gray-400 mt-0.5">{currentDuration}</div>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2">
          <Flag className="w-4 h-4 text-green-500 fill-current" />
          <span className="text-xs font-bold text-green-500">Upcoming Deadline</span>
        </div>

        <div className="mt-auto self-end">
          <button className="bg-[#1F4156] text-white px-5 py-2 rounded-lg text-xs font-medium hover:bg-opacity-90 transition-colors">
            Go to course
          </button>
        </div>
      </div>
    </div>
  );
};

const OFFLINE_COURSES = [
  {
    id: 1,
    title: "Chemistry",
    university: "Haramaya University",
    progressPercent: 10,
    downloadPercent: 100,
    currentTopic: "Introduction to Quantum Physics",
    currentDuration: "Video 15 min",
    imageSrc: "/images/courses/chemistry.png"
  },
  {
    id: 2,
    title: "Chemistry",
    university: "Haramaya University",
    progressPercent: 10,
    downloadPercent: 50,
    currentTopic: "Introduction to Quantum Physics",
    currentDuration: "Video 15 min",
    imageSrc: "/images/courses/chemistry.png"
  }
];

export const OfflineCoursesView: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-10 py-6 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/features/course" className="text-gray-400 hover:text-gray-600 transition-colors">
            Course
          </Link>
          <span className="text-gray-300">{">"}</span>
          <Link href="/features/course/enrolled" className="text-gray-400 hover:text-gray-600 transition-colors">
            Enrolled Course
          </Link>
          <span className="text-gray-300">{">"}</span>
          <span className="text-[#1F4156] font-medium">Offline Course</span>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1F4156] text-white hover:bg-opacity-90 transition-colors shadow-sm">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center px-10 mb-6">
        <div className="flex items-center w-full max-w-[900px] h-11 bg-[#F8F9FA] rounded-[10px] border border-gray-200 px-4 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search"
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button className="text-gray-500 hover:text-[#1F4156] transition-colors">
            <ArrowUpDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="max-w-[900px] mx-auto px-10 mb-8 grid grid-cols-3 gap-8">
        {/* Plan to learn */}
        <div>
          <p className="text-sm font-bold text-[#1F4156] mb-2">Plan to learn All courses</p>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#1F4156] rounded-full w-[5%]" />
            </div>
            <span className="text-xs font-bold text-gray-500">5%</span>
          </div>
          <p className="text-[11px] text-gray-400">Progress According to plan</p>
        </div>

        {/* Upcoming Deadline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-green-500 fill-current" />
            <p className="text-sm font-bold text-[#1F4156]">Upcoming Deadline</p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full w-[5%]" />
            </div>
            <span className="text-xs font-bold text-gray-500">5%</span>
          </div>
          <p className="text-[11px] text-gray-400">Progress According to plan</p>
        </div>

        {/* Passed Deadline */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-red-700 fill-current" />
            <p className="text-sm font-bold text-[#1F4156]">Passed Deadline</p>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-red-700 rounded-full w-[5%]" />
            </div>
            <span className="text-xs font-bold text-gray-500">5%</span>
          </div>
          <p className="text-[11px] text-gray-400">Progress According to plan</p>
        </div>
      </div>

      {/* Course List */}
      <div className="max-w-[900px] mx-auto px-10 pb-10">
        {OFFLINE_COURSES.map((course) => (
          <OfflineCourseCard
            key={course.id}
            title={course.title}
            university={course.university}
            progressPercent={course.progressPercent}
            downloadPercent={course.downloadPercent}
            currentTopic={course.currentTopic}
            currentDuration={course.currentDuration}
            imageSrc={course.imageSrc}
          />
        ))}
      </div>
    </div>
  );
};
