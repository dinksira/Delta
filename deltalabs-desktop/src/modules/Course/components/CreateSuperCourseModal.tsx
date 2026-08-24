"use client";

import React, { useState } from "react";
import {
  X,
  Search,
  ArrowUpDown,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Calendar,
  BookOpen,
  Users,
  Award
} from "lucide-react";
import { Modal } from "@/components/atoms/Modal";

interface CourseOption {
  id: string;
  title: string;
  university: string;
  rating: number;
  duration: string;
  chapters: number;
  enrolled: string;
}

const RECOMMENDED_COURSES: CourseOption[] = [
  {
    id: "rec-1",
    title: "Chemistry",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-2",
    title: "Chemistry 101",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-3",
    title: "Introduction",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-4",
    title: "Modern",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  }
];

const RECENT_COURSES: CourseOption[] = [
  {
    id: "rec-5",
    title: "Physics 101",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-6",
    title: "Math's",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-7",
    title: "Math 101",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  },
  {
    id: "rec-8",
    title: "Security",
    university: "Addis Ababa University",
    rating: 4,
    duration: "3 Week",
    chapters: 12,
    enrolled: "1,124 enrolled"
  }
];

export interface CreateSuperCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDone: (title: string, visibility: string, selectedCourse: CourseOption) => void;
}

export const CreateSuperCourseModal: React.FC<CreateSuperCourseModalProps> = ({
  isOpen,
  onClose,
  onDone,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  
  // Step 1 Form Fields
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState<"Public" | "Private">("Public");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Step 2 Selection
  const [activeSidebar, setActiveSidebar] = useState<"all" | "recommended" | "recent">("recommended");
  const [hoveredCourseId, setHoveredCourseId] = useState<string | null>(null);

  const handleNext = () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }
    setStep(2);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else {
      onClose();
    }
  };

  const selectCourse = (course: CourseOption) => {
    onDone(title, visibility, course);
    // Reset state
    setTitle("");
    setStep(1);
    onClose();
  };

  const activeCourses = activeSidebar === "recent" ? RECENT_COURSES : RECOMMENDED_COURSES;

  return (
    <Modal isOpen={isOpen} onClose={onClose} showHeader={false} className="max-w-[960px] rounded-[32px] overflow-hidden p-0">
      
      {/* STEP 1: SETUP DETAILS */}
      {step === 1 && (
        <div className="px-16 py-14 flex flex-col items-center">
          <h2 className="text-[24px] font-bold text-[#1F4156] mb-12">
            Setup your super course
          </h2>

          <div className="w-full max-w-[500px] flex flex-col gap-6">
            {/* Title Field */}
            <div className="flex flex-col gap-2">
              <label className="text-[13px] text-gray-500 font-medium pl-1">
                Super Course Title
              </label>
              <input
                type="text"
                placeholder="physics v1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full h-12 border border-gray-200 rounded-[10px] px-4 outline-none text-sm text-gray-700 placeholder:text-gray-300 focus:border-[#1F4156] transition-colors"
              />
            </div>

            {/* Visibility Field */}
            <div className="flex flex-col gap-2 relative">
              <label className="text-[13px] text-gray-500 font-medium pl-1">
                Visibility
              </label>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-full h-12 border rounded-[10px] px-4 flex items-center justify-between text-sm text-gray-600 transition-all bg-white ${
                  isDropdownOpen ? "border-[#1F4156] ring-1 ring-[#1F4156]" : "border-gray-200"
                }`}
              >
                <span>{visibility}</span>
                {isDropdownOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Custom Dropdown List */}
              {isDropdownOpen && (
                <div className="absolute top-[76px] left-0 w-full bg-white border border-gray-100 rounded-[10px] shadow-lg py-1.5 z-50">
                  <button
                    onClick={() => {
                      setVisibility("Private");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Private
                  </button>
                  <button
                    onClick={() => {
                      setVisibility("Public");
                      setIsDropdownOpen(false);
                    }}
                    className="w-full h-10 px-4 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Public
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="w-full max-w-[500px] flex items-center justify-between mt-20">
            <button
              onClick={handleBack}
              className="h-11 px-10 border border-[#1F4156] rounded-lg text-sm font-semibold text-[#1F4156] hover:bg-gray-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleNext}
              className="h-11 px-10 bg-[#1F4156] rounded-lg text-sm font-semibold text-white hover:bg-opacity-90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: COURSE SELECTION */}
      {step === 2 && (
        <div className="p-8 relative">
          {/* Close button */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Search Header */}
          <div className="flex w-full mb-8 mt-2">
            <div className="flex items-center w-[360px] h-11 bg-[#F8F9FA] rounded-[10px] border border-gray-200 px-4">
              <Search className="w-4 h-4 text-gray-400 mr-2.5" />
              <input
                type="text"
                placeholder="Search"
                className="flex-1 bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
              />
              <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
                <button className="text-gray-500 hover:text-[#1F4156]">
                  <ArrowUpDown className="w-4 h-4" />
                </button>
                <button className="text-gray-500 hover:text-[#1F4156]">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            {/* Sidebar Categories */}
            <div className="w-[180px] flex flex-col gap-2 border-r border-gray-100 pr-6">
              <button
                onClick={() => setActiveSidebar("all")}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  activeSidebar === "all" ? "bg-[#F0F2F4] text-[#1F4156]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                All Course
              </button>
              <button
                onClick={() => setActiveSidebar("recommended")}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  activeSidebar === "recommended" ? "bg-[#F0F2F4] text-[#1F4156]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Recommended
              </button>
              <button
                onClick={() => setActiveSidebar("recent")}
                className={`w-full text-left py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  activeSidebar === "recent" ? "bg-[#F0F2F4] text-[#1F4156]" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Recently Courses
              </button>
            </div>

            {/* Content Cards Grid */}
            <div className="flex-1 pr-4 max-h-[380px] overflow-y-auto">
              <h3 className="text-xs font-semibold text-gray-400 mb-4 capitalize">
                {activeSidebar === "recent" ? "Recently Courses" : "Recommended"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {activeCourses.map((course) => (
                  <div
                    key={course.id}
                    onMouseEnter={() => setHoveredCourseId(course.id)}
                    onMouseLeave={() => setHoveredCourseId(null)}
                    className="flex flex-col bg-[#EEF2F4] rounded-xl p-4 relative h-[140px] justify-between shadow-sm cursor-pointer"
                  >
                    
                    {/* Top line with title and certificate icon */}
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1">
                          <h4 className="text-sm font-bold text-[#1F4156]">{course.title}</h4>
                          <span className="text-gray-400">|</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-[120px]">{course.university}</span>
                        </div>
                        {/* Rating stars */}
                        <div className="flex items-center gap-0.5 mt-1 text-[#1F4156]">
                          {[...Array(course.rating)].map((_, i) => (
                            <span key={i} className="text-[10px] font-bold">★</span>
                          ))}
                          <span className="text-[10px] text-gray-400">☆</span>
                        </div>
                      </div>
                      
                      {/* Certificate Badge */}
                      <div className="bg-white p-1 rounded border border-gray-100 flex items-center justify-center">
                        <Award className="w-5 h-5 text-yellow-500 fill-current" />
                      </div>
                    </div>

                    {/* Metadata indicators */}
                    <div className="flex flex-col gap-1.5 mt-2">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
                        <Calendar className="w-3.5 h-3.5" /> Duration {course.duration}
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5" /> {course.chapters} Chapters
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" /> {course.enrolled}
                        </div>
                      </div>
                    </div>

                    {/* Hover use course overlay */}
                    {hoveredCourseId === course.id && (
                      <div className="absolute inset-0 bg-[#174A5F]/15 backdrop-blur-[1px] rounded-xl flex items-center justify-center transition-all">
                        <button 
                          onClick={() => selectCourse(course)}
                          className="bg-[#1F4156] text-white px-4 py-1.5 rounded-lg text-xs font-semibold hover:bg-opacity-95 shadow-md"
                        >
                          Use Course
                        </button>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Paid filter bottom float */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
            <div className="flex items-center gap-1.5 bg-white border border-gray-200 shadow-lg px-4 py-1.5 rounded-full text-[10px] font-bold text-gray-600">
              <SlidersHorizontal className="w-3.5 h-3.5 text-gray-600" />
              Paid
            </div>
          </div>

        </div>
      )}
      
    </Modal>
  );
};
