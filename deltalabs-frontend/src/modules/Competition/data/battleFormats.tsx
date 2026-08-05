/**
 * battleFormats data
 * Demo catalogue of battle formats for the Create Topic Battle wizard
 * (battle format step). Follows the Step 2 redesign spec: 5 cards in a
 * 3-column grid — Row 1: 1 VS 1 Duel, Mini Tournament (Recommended),
 * Tournament 8; Row 2: Tournament 16, Tournament 32 (left-aligned).
 */

import { Gauge, Swords, Timer, Trophy } from "lucide-react";

import type { BattleFormat } from "@/components/molecules/BattleFormatCard";

const STANDARD_FEATURES = [
  "Instant matchmaking",
  "Best of 10 questions",
  "Quick 5 minute rounds",
];

export const BATTLE_FORMATS: BattleFormat[] = [
  {
    id: "1v1",
    title: "1 VS 1 Duel",
    description: "Classic head to head battle",
    icon: <Swords className="size-5" />,
    metrics: { players: "2 Players", duration: "5 min" },
    features: STANDARD_FEATURES,
    structureLabel: "Tournament Structure",
    chips: ["P1", "P2"],
    chipsSeparator: "vs",
  },
  {
    id: "mini",
    title: "Mini Tournament",
    description: "Small group elimination",
    icon: <Trophy className="size-5" />,
    metrics: { players: "4 Players", duration: "10 min" },
    features: STANDARD_FEATURES,
    structureLabel: "Tournament Structure",
    chips: ["1", "2", "3", "4"],
    recommended: true,
  },
  {
    id: "t8",
    title: "Tournament",
    description: "Competitive bracket system",
    icon: <Gauge className="size-5" />,
    metrics: { players: "8 Players", duration: "15 min" },
    features: STANDARD_FEATURES,
    structureLabel: "Tournament Structure",
    chips: ["1", "2", "3", "4", "..."],
  },
  {
    id: "t16",
    title: "Tournament",
    description: "Competitive bracket system",
    icon: <Timer className="size-5" />,
    metrics: { players: "16 Players", duration: "30 min" },
    features: STANDARD_FEATURES,
    structureLabel: "Tournament Structure",
    chips: ["1", "2", "3", "4", "..."],
  },
  {
    id: "t32",
    title: "Tournament",
    description: "Competitive bracket system",
    icon: <Gauge className="size-5" />,
    metrics: { players: "32 Players", duration: "1 hour" },
    features: STANDARD_FEATURES,
    structureLabel: "Tournament Structure",
    chips: ["1", "2", "3", "4", "..."],
  },
];
