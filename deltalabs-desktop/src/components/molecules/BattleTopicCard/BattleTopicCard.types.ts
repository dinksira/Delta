import type { ReactNode } from "react";

/** Difficulty label shown on a battle topic card (spec: Mixed/Hard/Easy). */
export type BattleTopicDifficulty = "Easy" | "Mixed" | "Hard";

/** A selectable topic a user can pick to build a topic battle around. */
export interface BattleTopic {
  id: string;
  name: string;
  /** Topic category used for filtering (e.g. "Science", "Programming"). */
  category: string;
  difficulty: BattleTopicDifficulty;
  /** Marks the topic as trending ("Popular" badge). */
  isPopular?: boolean;
  /** Optional per-subject icon rendered inside the card's icon chip. */
  icon?: ReactNode;
  /** Optional question count shown as "N Questions". */
  questionCount?: number;
}

export interface BattleTopicCardProps {
  topic: BattleTopic;
  /** Selected cards get a primary border + focus ring. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  /** Renders a checkbox affordance instead of the difficulty pill (multi-select mode). */
  multiSelect?: boolean;
  className?: string;
}
