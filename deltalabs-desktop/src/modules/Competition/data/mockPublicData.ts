/**
 * Mock data for the Public Competition landing page.
 */

import type { UserStatus, Achievement, GameMode, UpcomingCompetition } from "@/modules/Competition/types/public";

// ============================================================================
// MOCK DATA — USER STATUS
// ============================================================================

export const MOCK_USER_STATUS: UserStatus = {
  level: 47,
  tier: "Diamond III",
  currentPoints: 8750,
  maxPoints: 10000,
  totalEarnings: "20,000 ETB",
  totalWon: 89,
};

// ============================================================================
// MOCK DATA — ACHIEVEMENTS
// ============================================================================

export const MOCK_ACHIEVEMENTS: Achievement[] = [
  { id: "champion", icon: "trophy", title: "Champion", description: "Win a Championship tournament" },
  { id: "earnings", icon: "coin", title: "500,000 ETB", description: "Reach 500,000 ETB in total earnings" },
  { id: "course", icon: "book", title: "Course Subscription", description: "Win a premium course subscription" },
];

// ============================================================================
// MOCK DATA — GAME MODES
// ============================================================================

export const MOCK_GAME_MODES: GameMode[] = [
  { id: "topic-battles", icon: "swords", title: "Topic Battles", description: "Challenge others in subject-specific duels", ctaLabel: "Enter Battle", ctaAction: "enter-battle" },
  { id: "championship", icon: "trophy", title: "Championship", description: "Compete in tournament brackets", ctaLabel: "Join Tournament", ctaAction: "join-tournament" },
  { id: "live-duels", icon: "clock", title: "Live Duels", description: "Real-time Q&A battles", ctaLabel: "Quick Match", ctaAction: "quick-match" },
];

// ============================================================================
// MOCK DATA — UPCOMING COMPETITIONS
// ============================================================================

export const MOCK_UPCOMING_COMPETITIONS: UpcomingCompetition[] = [
  { id: "uc-1", title: "UX Design Sprint", category: "Physics", playerCount: 32, status: "filling", fee: "250 ETB" },
  { id: "uc-2", title: "DataViz Challenge", category: "Mathematics", playerCount: 18, status: "filling", fee: "Free" },
  { id: "uc-3", title: "Bug Bash 2025", category: "Computer Science", playerCount: 45, status: "starting", fee: "100 ETB" },
  { id: "uc-4", title: "Game Jam: Retro", category: "Design", playerCount: 27, status: "filling", fee: "Free" },
  { id: "uc-5", title: "AI Prompt Cup", category: "AI & ML", playerCount: 60, status: "starting", fee: "500 ETB" },
  { id: "uc-6", title: "Frontend Fitness", category: "Web Dev", playerCount: 15, status: "filling", fee: "Free" },
];
