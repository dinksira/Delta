/**
 * battleVisibility data
 * Match type options for the Create Topic Battle wizard (match type step).
 * Follows the Step 3 redesign spec: Public Match / Private Match, each with a
 * feature checklist and a "Best for" audience pill.
 */

import { Globe2, Lock } from "lucide-react";

import type { MatchVisibility } from "@/components/molecules/MatchVisibilityCard";

export const BATTLE_VISIBILITIES: MatchVisibility[] = [
  {
    id: "public",
    title: "Public Match",
    description: "Anyone can find and join your battle",
    icon: <Globe2 className="size-5" />,
    features: [
      "Appears in tournament browser",
      "Faster Player matchmaking",
      "Eligible for leaderboards",
    ],
    bestFor: "Maximum Competition",
  },
  {
    id: "private",
    title: "Private Match",
    description: "Invite-only battle with friends",
    icon: <Lock className="size-5" />,
    features: [
      "Join code protected",
      "Custom player invites",
      "Exclusive friend battle",
    ],
    bestFor: "Friend groups & teams",
  },
];
