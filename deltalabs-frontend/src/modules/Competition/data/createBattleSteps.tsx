/**
 * createBattleSteps data
 * The 8 fixed steps of the Create Topic Battle wizard, in order, with the
 * lucide icon rendered inside each ProgressStepper badge. Labels match the
 * Step 1 redesign spec (Topic Selection → Review & Launch).
 */

import { CalendarClock, Database, Folder, Globe2, Rocket, Swords, Trophy, Users } from "lucide-react";

import type { CreateBattleWizardStep } from "@/modules/Competition/types/createBattle";

export const CREATE_BATTLE_STEPS: CreateBattleWizardStep[] = [
  { id: "topic-selection", label: "Topic Selection", icon: <Folder className="size-6" /> },
  { id: "battle-format", label: "Battle Format", icon: <Swords className="size-6" /> },
  { id: "match-type", label: "Match Type", icon: <Globe2 className="size-6" /> },
  { id: "player-setup", label: "Player Setup", icon: <Users className="size-6" /> },
  { id: "prize-rules", label: "Prize Rules", icon: <Trophy className="size-6" /> },
  { id: "date-time", label: "Date & Time", icon: <CalendarClock className="size-6" /> },
  { id: "questions", label: "Questions", icon: <Database className="size-6" /> },
  { id: "review-launch", label: "Review & Launch", icon: <Rocket className="size-6" /> },
];

export const CREATE_BATTLE_TOTAL_STEPS = CREATE_BATTLE_STEPS.length;
