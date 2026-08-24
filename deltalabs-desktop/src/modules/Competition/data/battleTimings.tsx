/**
 * battleTimings data
 * "When to start Battle" timing options for the Create Topic Battle wizard
 * (match type step). Follows the Step 3 redesign spec: Start Instantly /
 * Schedule Later. Ids map to `draft.visibility.timing`.
 */

import { CalendarClock, Flame } from "lucide-react";

import type { TimingOption } from "@/components/molecules/TimingOptionCard";

export const BATTLE_TIMINGS: TimingOption[] = [
  {
    id: "instant",
    title: "Start Instantly",
    description: "Begin as soon as all players join",
    icon: <Flame className="size-5" />,
  },
  {
    id: "schedule",
    title: "Schedule Later",
    description: "Set specific date and time",
    icon: <CalendarClock className="size-5" />,
  },
];
