/**
 * Mock competition data for development.
 */

import type { Competition } from "@/modules/Competition/types";

// ============================================================================
// CONSTANTS
// ============================================================================

const BG_IMAGES = [
  "/images/card-bg.jpg",
  "/images/card2.jpg",
  "/images/card3.jpg",
  "/images/card4.jpg",
];

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_COMPETITIONS: Competition[] = [
  {
    id: "comp-1",
    title: "UX Design Sprint",
    endsAt: "2025-05-05",
    participants: 120,
    tags: ["Design", "UI/UX"],
    backgroundImageUrl: BG_IMAGES[0],
    category: "active",
  },
  {
    id: "comp-2",
    title: "DataViz Storytelling Challenge",
    endsAt: "2025-05-12",
    participants: 89,
    tags: ["Data", "Design"],
    backgroundImageUrl: BG_IMAGES[1],
    category: "active",
  },
  {
    id: "comp-3",
    title: "Bug Bash 2025",
    endsAt: "2025-05-20",
    participants: 210,
    tags: ["Bug", "QA"],
    backgroundImageUrl: BG_IMAGES[2],
    category: "active",
  },
  {
    id: "comp-4",
    title: "Game Jam: Retro Revival",
    endsAt: "2025-06-01",
    participants: 340,
    tags: ["Game", "UI/UX"],
    backgroundImageUrl: BG_IMAGES[3],
    category: "active",
  },
  {
    id: "comp-5",
    title: "AI Prompt Engineering Cup",
    endsAt: "2025-06-15",
    participants: 156,
    tags: ["Data", "Design"],
    backgroundImageUrl: BG_IMAGES[0],
    category: "active",
  },
  {
    id: "comp-6",
    title: "Frontend Fitness Challenge",
    endsAt: "2025-06-30",
    participants: 73,
    tags: ["UI/UX", "Design"],
    backgroundImageUrl: BG_IMAGES[1],
    category: "active",
  },
  {
    id: "comp-7",
    title: "Spring 2025 Hackathon",
    endsAt: "2025-04-01",
    participants: 450,
    tags: ["Design", "Game", "Data"],
    backgroundImageUrl: BG_IMAGES[2],
    category: "recent",
  },
  {
    id: "comp-8",
    title: "Code Review Olympiad",
    endsAt: "2025-03-15",
    participants: 98,
    tags: ["QA", "Bug"],
    backgroundImageUrl: BG_IMAGES[3],
    category: "recent",
  },
  {
    id: "comp-9",
    title: "Community Design Feedback Fest",
    endsAt: "2025-07-10",
    participants: 55,
    tags: ["Design", "UI/UX"],
    backgroundImageUrl: BG_IMAGES[0],
    category: "community",
  },
  {
    id: "comp-10",
    title: "Open Source Contributor Jam",
    endsAt: "2025-07-25",
    participants: 200,
    tags: ["Data", "Bug"],
    backgroundImageUrl: BG_IMAGES[1],
    category: "community",
  },
];
