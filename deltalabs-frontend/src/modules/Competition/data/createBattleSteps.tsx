/**
 * createBattleSteps data
 * The 8 fixed steps of the Create Topic Battle wizard, in order, with the
 * lucide icon rendered inside each ProgressStepper badge. Labels match the
 * Step 1 redesign spec (Topic Selection → Review & Launch).
 *
 * `getWizardSteps(timing)` returns the visible step list for the current
 * "When to start Battle" choice: the Date & Time step is dropped for
 * "Start Instantly" (there is nothing to schedule) and kept for
 * "Schedule Later".
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

/** 1-based index of a step id in the given step list (0 if not present). */
function stepIndex(steps: CreateBattleWizardStep[], id: string): number {
  return steps.findIndex((s) => s.id === id) + 1;
}

/** Visible wizard steps for the given start timing. */
export function getWizardSteps(timing: "instant" | "schedule"): CreateBattleWizardStep[] {
  if (timing === "instant") {
    return CREATE_BATTLE_STEPS.filter((s) => s.id !== "date-time");
  }
  return CREATE_BATTLE_STEPS;
}

/** 1-based step index for a step id, accounting for the active timing. */
export function getWizardStepIndex(
  id: string,
  timing: "instant" | "schedule",
): number {
  return stepIndex(getWizardSteps(timing), id);
}

/** Step id at a 1-based position within the active timing's visible steps. */
export function getWizardStepId(
  position: number,
  timing: "instant" | "schedule",
): string | undefined {
  return getWizardSteps(timing)[position - 1]?.id;
}
