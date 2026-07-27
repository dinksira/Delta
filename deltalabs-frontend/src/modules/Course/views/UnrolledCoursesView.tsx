"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  Pencil,
  Star,
  Flag,
  Calendar,
  FileText,
  Trash2,
  Pause,
  CheckCircle2
} from "lucide-react";

interface UnrolledCourseCardProps {
  title: string;
  university: string;
  progressPercent: number;
  unenrollDate: string;
  daysAgo: string;
  currentTopic: string;
  currentDuration: string;
  imageSrc: string;
  refundDone?: boolean;
}

const UnrolledCourseCard: React.FC<UnrolledCourseCardProps> = ({
  title,
  university,
  progressPercent,
  unenrollDate,
  daysAgo,
  currentTopic,
  currentDuration,
  imageSrc,
  refundDone = false,
}) => {
  return (
    <div className="flex w-full bg-[#EEF2F4] rounded-2xl overflow-hidden mb-5 shadow-sm h-[190px]">
      {/* Left Image */}
      <div className="w-[200px] flex-shrink-0 relative">
        <Image src={imageSrc} alt={title} fill className="object-cover" />
      </div>

      {/* Middle Content */}
      <div className="flex-1 px-6 py-5 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-[16px] font-bold text-[#1F4156]">{title}</h2>
            <div className="w-px h-4 bg-gray-300" />
            <span className="text-[12px] text-gray-500">{university}</span>
          </div>

          <div className="mt-2">
            <span className="text-[12px] text-gray-500 block mb-1">Rate</span>
            <div className="flex items-center gap-0.5 text-[#1F4156]">
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 fill-current" />
              <Star className="w-3.5 h-3.5 text-gray-300" />
            </div>
          </div>

          <div className="mt-2.5 max-w-[240px]">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] text-gray-500 font-medium">Overall progress</span>
              <Pause className="w-3 h-3 text-[#1F4156] fill-current" />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1 bg-white rounded-full overflow-hidden">
                <div className="h-full bg-[#1F4156] rounded-full" style={{ width: `${progressPercent}%` }} />
              </div>
              <span className="text-[11px] font-bold text-black">{progressPercent}%</span>
            </div>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="mt-2">
          {refundDone ? (
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-green-600">
              <CheckCircle2 className="w-4 h-4" /> Refund Done
            </button>
          ) : (
            <button className="flex items-center gap-1.5 text-[12px] font-medium text-gray-500 hover:text-[#1F4156] transition-colors">
              <span className="text-[14px]">↩</span> Ask Refund Course
            </button>
          )}
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-[300px] flex-shrink-0 flex py-5 px-4 border-l border-white/60 gap-4">
        {/* Center column */}
        <div className="flex-1 flex flex-col gap-3">
          {/* UNROLLED badge */}
          <div className="flex items-center gap-2">
            <Flag className="w-4 h-4 text-gray-400" />
            <span className="text-[11px] font-bold tracking-wide text-gray-500">UNROLLED</span>
          </div>

          {/* Unenroll Date */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="text-gray-400">—</span>
            <span className="font-medium">unenroll Date</span>
            <Calendar className="w-3.5 h-3.5 text-gray-400 ml-1" />
            <span>{unenrollDate}</span>
          </div>

          {/* Days ago */}
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <span className="text-gray-400">+</span>
            <span>{daysAgo}</span>
          </div>

          {/* View Planner */}
          <button className="text-left text-[11px] font-semibold text-gray-500 hover:text-[#1F4156] transition-colors">
            View Planner
          </button>
        </div>

        {/* Far right column */}
        <div className="flex flex-col items-end justify-between">
          {/* Current topic + delete */}
          <div className="flex items-start gap-2">
            <div className="flex flex-col items-start">
              <span className="text-[9px] text-gray-400 mb-0.5">Current</span>
              <div className="flex items-center gap-1">
                <FileText className="w-4 h-4 text-gray-400" />
                <div>
                  <a href="#" className="text-[10px] font-medium text-gray-500 underline hover:text-[#1F4156] leading-none">
                    {currentTopic}
                  </a>
                  <div className="text-[9px] text-gray-400 mt-0.5">{currentDuration}</div>
                </div>
              </div>
            </div>
            <button className="text-gray-300 hover:text-gray-500 transition-colors mt-1">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Enroll Again */}
          <button className="bg-[#1F4156] text-white px-5 py-2 rounded-lg text-[12px] font-medium hover:bg-opacity-90 transition-colors whitespace-nowrap">
            Enroll Again
          </button>
        </div>
      </div>
    </div>
  );
};

const UNROLLED_COURSES = [
  {
    id: 1,
    title: "Chemistry",
    university: "Haramaya University",
    progressPercent: 10,
    unenrollDate: "July 12, 2024",
    daysAgo: "2 days ago",
    currentTopic: "Introduction to Quantum Physics",
    currentDuration: "Video 15 min",
    imageSrc: "/images/courses/biology.png",
    refundDone: false
  },
  {
    id: 2,
    title: "Chemistry",
    university: "Haramaya University",
    progressPercent: 10,
    unenrollDate: "July 12, 2024",
    daysAgo: "2 days ago",
    currentTopic: "Introduction to Quantum Physics",
    currentDuration: "Video 15 min",
    imageSrc: "/images/courses/biology.png",
    refundDone: true
  }
];

export const UnrolledCoursesView: React.FC = () => {
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
          <span className="text-[#1F4156] font-medium">Unrolled Courses</span>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1F4156] text-white hover:bg-opacity-90 transition-colors shadow-sm">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center px-10 mb-6">
        <div className="flex items-center w-full max-w-[700px] h-10 bg-[#F8F9FA] rounded-[10px] border border-gray-200 px-4 shadow-sm">
          <Search className="w-4 h-4 text-gray-400 mr-3" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 bg-transparent text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
          <button className="text-gray-400 hover:text-[#1F4156] transition-colors ml-2">
            <Search className="w-4 h-4" />
          </button>
          <button className="text-gray-400 hover:text-[#1F4156] transition-colors ml-3">
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Course Count + List */}
      <div className="max-w-[900px] mx-auto px-10 pb-10">
        <h2 className="text-[15px] font-bold text-[#1F4156] mb-5">
          {UNROLLED_COURSES.length} Unrolled Courses
        </h2>

        {UNROLLED_COURSES.map(course => (
          <UnrolledCourseCard
            key={course.id}
            title={course.title}
            university={course.university}
            progressPercent={course.progressPercent}
            unenrollDate={course.unenrollDate}
            daysAgo={course.daysAgo}
            currentTopic={course.currentTopic}
            currentDuration={course.currentDuration}
            imageSrc={course.imageSrc}
            refundDone={course.refundDone}
          />
        ))}
      </div>
    </div>
  );
};
