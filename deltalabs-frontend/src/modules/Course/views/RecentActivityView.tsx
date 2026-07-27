"use client";

import React from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";

interface ActivityItem {
  id: number;
  title: string;
  description: string;
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 1,
    title: "Physics",
    description: "You have enrolled in physics course by Haramaya University."
  },
  {
    id: 2,
    title: "Biology",
    description: "You have enrolled in biology course by Haramaya University."
  },
  {
    id: 3,
    title: "Supers course Created",
    description: "biology 101 and modern biology super course created"
  },
  {
    id: 4,
    title: "Course Deleted",
    description: "You have enrolled in physics course by Haramaya University."
  },
  {
    id: 5,
    title: "Physics",
    description: "You have enrolled in physics course by Haramaya University."
  },
  {
    id: 6,
    title: "Physics",
    description: "You have enrolled in physics course by Haramaya University."
  },
  {
    id: 7,
    title: "Physics",
    description: "You have enrolled in physics course by Haramaya University."
  }
];

export const RecentActivityView: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header / Breadcrumbs */}
      <div className="flex items-center justify-between px-10 py-8 max-w-[1600px] mx-auto">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/features/course" className="text-gray-400 hover:text-gray-600 transition-colors">
            Course
          </Link>
          <span className="text-gray-300">{">"}</span>
          <span className="text-[#1F4156] font-medium">Recent activity</span>
        </div>
        <button className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#1F4156] text-white hover:bg-opacity-90 transition-colors shadow-sm">
          <Pencil className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="max-w-[1200px] mx-auto px-10 pb-16">
        <h2 className="text-[20px] font-bold text-[#1F4156] mb-8">
          Recent Activity
        </h2>

        {/* Activity Feed List */}
        <div className="flex flex-col gap-4">
          {ACTIVITIES.map((activity) => (
            <div 
              key={activity.id}
              className="bg-white border border-gray-150 rounded-xl py-5 px-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <h3 className="text-[15px] font-bold text-[#1F4156] mb-1">
                {activity.title}
              </h3>
              <p className="text-[13px] text-gray-500 font-medium">
                {activity.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
