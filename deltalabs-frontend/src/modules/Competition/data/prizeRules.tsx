/**
 * prizeRules data
 * Prize distribution rules for the Create Topic Battle wizard (prize rules
 * step). Follows the Step 5 redesign spec: Winner Takes All (Recommended),
 * Top 3 Split, and Split Pot, each with a muted tag pill.
 */

import { Timer, Trophy, Users } from "lucide-react";

import type { PrizeRule } from "@/components/molecules/PrizeRuleCard";

export const PRIZE_RULES: PrizeRule[] = [
  {
    id: "winner-takes-all",
    title: "Winner Takes All",
    description: "Champion gets the entire prize pool",
    icon: <Trophy className="size-5" />,
    tag: "Maximum Competition intensity",
    recommended: true,
  },
  {
    id: "top-3-split",
    title: "Top 3 Split",
    description: "Prize divided among top performers",
    icon: <Timer className="size-5" />,
    tag: "Balanced risk and reward",
  },
  {
    id: "split-pot",
    title: "Split Pot",
    description: "Equal distribution to top half",
    icon: <Users className="size-5" />,
    tag: "Lower risk, more winners",
  },
];
