/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** SummaryLobby Organism: Manages the summary feed and reminders. */
import React, { useState } from "react";
import { Typography } from "@/components/theme";
import { SummaryCard } from "../molecules/SummaryCard";
import { ReminderItem } from "../molecules/ReminderItem";
import { CommunitySearchBar } from "../../exercise/molecules/CommunitySearchBar";
import { cx } from "@/components/theme/utils";

type SummaryCategory = "saved" | "mine" | "school" | "community" | "history";

const DUMMY_SUMMARIES = [
  { id: "1", university: "Addis ababa university", title: "Physics: A brief summary on core topics", description: "An intense way to learn about the process and practice your designs skills — My 1st hackathon Hackathons have been on my mind since I heard it was a good way to gain experience as a junior UX designer. As my portfolio...", isPublic: false, badges: ["Full course"], readTime: "3 min" },
  { id: "2", university: "Addis ababa university", title: "Physics: A brief summary on core topics", description: "An intense way to learn about the process and practice your designs skills — My 1st hackathon Hackathons have been on my mind since I heard it was a good way to gain experience as a junior UX designer. As my portfolio...", isPublic: true, badges: ["Full course", "Full course"], readTime: "3 min" },
  { id: "3", university: "Addis ababa university", title: "Physics: A brief summary on core topics", description: "An intense way to learn about the process and practice your designs skills — My 1st hackathon Hackathons have been on my mind since I heard it was a good way to gain experience as a junior UX designer. As my portfolio...", isPublic: true, badges: ["Full course"], readTime: "3 min" },
];

const DUMMY_REMINDERS = [
  { id: "1", userName: "Amit Das", userAvatar: "https://i.pravatar.cc/150?u=20", title: "Physics: A brief summary on core topics", isActive: true },
  { id: "2", userName: "Amit Das", userAvatar: "https://i.pravatar.cc/150?u=21", title: "Physics: A brief summary on core topics", isActive: true },
  { id: "3", userName: "Amit Das", userAvatar: "https://i.pravatar.cc/150?u=22", title: "Physics: A brief summary on core topics", isActive: false },
  { id: "4", userName: "Amit Das", userAvatar: "https://i.pravatar.cc/150?u=23", title: "Physics: A brief summary on core topics", isActive: true },
  { id: "5", userName: "Amit Das", userAvatar: "https://i.pravatar.cc/150?u=24", title: "Physics: A brief summary on core topics", isActive: true },
];

export const SummaryLobby: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<SummaryCategory>("saved");

  const categories = [
    { id: "saved" as SummaryCategory, label: "Saved" },
    { id: "mine" as SummaryCategory, label: "My Summaries" },
    { id: "school" as SummaryCategory, label: "School" },
    { id: "community" as SummaryCategory, label: "Community" },
    { id: "history" as SummaryCategory, label: "History" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Top Tabs: Sticky with blur */}
      <div className="sticky top-[-8px] z-40 bg-white/95 backdrop-blur-md -mx-8 px-8 border-b border-[#E2E8F0]/30 w-[calc(100%+64px)]">
        <div className="flex items-center gap-12 w-fit">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cx(
                  "relative py-4 text-[18px] font-black transition-all duration-300",
                  isActive ? "text-[#114B5F]" : "text-[#64748B]/60 hover:text-[#114B5F]/80"
                )}
              >
                {cat.label}
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[3px] bg-[#114B5F] rounded-t-full shadow-[0_-2px_6px_rgba(17,75,95,0.3)]" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Columns */}
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Left Feed */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="max-w-2xl">
            <CommunitySearchBar />
          </div>
          
          <div className="flex flex-col">
            {DUMMY_SUMMARIES.map((summary) => (
              <SummaryCard key={summary.id} {...summary} />
            ))}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-full lg:w-[300px] flex flex-col gap-6">
          <Typography className="text-[18px] font-black text-[#111827] text-center">
            Reminder
          </Typography>
          <div className="flex flex-col divide-y divide-[#E2E8F0]/40">
            {DUMMY_REMINDERS.map((reminder) => (
              <ReminderItem key={reminder.id} {...reminder} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryLobby;
/** ################################ /COMPONENT ############################# */
