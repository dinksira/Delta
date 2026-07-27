"use client";

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** ResourceLobby Organism: Orchestrates the resource hub and category management. */
import React, { useState } from "react";
import { Typography, Button } from "@/components/theme";
import { Search, ShoppingCart, Sparkles } from "lucide-react";
import { ResourceCard } from "../molecules/ResourceCard";
import { cx } from "@/components/theme/utils";

type ResourceCategory = "books" | "docs" | "slides" | "videos" | "generated";

interface ResourceData {
  id: string;
  title: string;
  author: string;
  rating: number;
  thumbnail: string;
  actionLabel: "Read" | "Watch";
}

const CATEGORY_DATA: Record<ResourceCategory, ResourceData[]> = {
  books: [
    { id: "b1", title: "Cambridge Physics", author: "Leul Solomon", rating: 4, thumbnail: "/course_thumbnail_workspace_1776179531260.png", actionLabel: "Read" },
    { id: "b2", title: "Essential Physics", author: "Abebe K.", rating: 5, thumbnail: "/course_thumbnail_workspace_1776179531260.png", actionLabel: "Read" },
    { id: "b3", title: "Cambridge Physics", author: "Leul Solomon", rating: 4, thumbnail: "/course_thumbnail_workspace_1776179531260.png", actionLabel: "Read" },
    { id: "b4", title: "Cambridge Physics", author: "Leul Solomon", rating: 4, thumbnail: "/course_thumbnail_workspace_1776179531260.png", actionLabel: "Read" },
  ],
  docs: [
    { id: "d1", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400", actionLabel: "Read" },
    { id: "d2", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400", actionLabel: "Read" },
    { id: "d3", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&q=80&w=400", actionLabel: "Read" },
  ],
  slides: [
    { id: "s1", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Microsoft_PowerPoint_2013-2019_logo.svg/1200px-Microsoft_PowerPoint_2013-2019_logo.svg.png", actionLabel: "Read" },
    { id: "s2", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Microsoft_PowerPoint_2013-2019_logo.svg/1200px-Microsoft_PowerPoint_2013-2019_logo.svg.png", actionLabel: "Read" },
    { id: "s3", title: "Cambridge Biology", author: "Leul Solomon", rating: 4, thumbnail: "https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Microsoft_PowerPoint_2013-2019_logo.svg/1200px-Microsoft_PowerPoint_2013-2019_logo.svg.png", actionLabel: "Read" },
  ],
  videos: [
    { id: "v1", title: "Science: The Best Invents", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400", actionLabel: "Watch" },
    { id: "v2", title: "Science: The Best Invents", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400", actionLabel: "Watch" },
    { id: "v3", title: "Science: The Best Invents", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400", actionLabel: "Watch" },
  ],
  generated: [
    { id: "g1", title: "Cambridge Physics", author: "Leul Solomon", rating: 4, thumbnail: "/course_thumbnail_workspace_1776179531260.png", actionLabel: "Read" },
    { id: "g2", title: "Science: The Best Invents", author: "Leul Solomon", rating: 4, thumbnail: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=400", actionLabel: "Watch" },
  ]
};

export const ResourceLobby: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<ResourceCategory>("books");

  const categories = [
    { id: "books" as ResourceCategory, label: "Books" },
    { id: "docs" as ResourceCategory, label: "Documentations" },
    { id: "slides" as ResourceCategory, label: "Slides" },
    { id: "videos" as ResourceCategory, label: "Youtube Videos" },
    { id: "generated" as ResourceCategory, label: "Generated" },
  ];

  const currentResources = CATEGORY_DATA[activeCategory];

  return (
    <div className="flex flex-col gap-10">
      {/* Header & Controls: Sticky Area */}
      <div className="sticky top-[-8px] z-40 bg-white/95 backdrop-blur-md -mx-8 px-8 border-b border-[#E2E8F0]/30 w-[calc(100%+64px)] pb-6 flex flex-col gap-10">
        {/* Header Tabs */}
        <div className="flex items-center gap-16 w-fit">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cx(
                  "relative py-4 text-[16px] font-black transition-all duration-300",
                  isActive ? "text-[#111827]" : "text-[#64748B]/60 hover:text-[#111827]/80"
                )}
              >
                {cat.label}
                {isActive && (
                  <div className="absolute bottom-[-1px] left-0 right-0 h-[2px] bg-[#114B5F] rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* Control Row */}
        <div className="flex items-center gap-6">
          <div className="flex-1 relative max-w-2xl">
            <input 
              type="text" 
              placeholder="Search"
              className="w-full h-14 pl-12 pr-16 rounded-xl border border-[#E2E8F0] bg-white text-[15px] outline-none focus:border-[#114B5F] transition-all"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#64748B]" size={20} />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#114B5F]">
              <Sparkles size={24} />
            </div>
          </div>

          <Button className="!bg-[#114B5F] !text-white rounded-xl px-10 h-14 text-[15px] font-black border-none shadow-xl shadow-[#114B5F]/20 hover:brightness-110 active:scale-95 transition-all">
            Generate
          </Button>

          <button className="w-14 h-14 rounded-xl bg-[#114B5F] text-white flex items-center justify-center shadow-lg shadow-[#114B5F]/20 hover:scale-105 transition-transform active:scale-95">
            <ShoppingCart size={24} />
          </button>
        </div>
      </div>

      {/* Chapters Grid */}
      <div className="flex flex-col gap-12">
        {/* Chapter 1 */}
        <div className="flex flex-col gap-6">
          <Typography className="text-[20px] font-black text-[#114B5F]">Chapter 1</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {currentResources.map((res) => (
              <ResourceCard key={res.id} {...res} />
            ))}
          </div>
        </div>

        {/* Chapter 2 */}
        <div className="flex flex-col gap-6">
          <Typography className="text-[20px] font-black text-[#114B5F]">Chapter 2</Typography>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 opacity-60">
             {currentResources.slice(0, 2).map((res) => (
              <ResourceCard key={`${res.id}-c2`} {...res} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceLobby;
/** ################################ /COMPONENT ############################# */
