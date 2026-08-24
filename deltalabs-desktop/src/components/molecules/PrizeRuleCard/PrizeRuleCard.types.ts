import type { ReactNode } from "react";

/**
 * One selectable prize distribution rule for the Create Topic Battle wizard
 * (prize rules step). Follows the Step 5 redesign spec
 * (Winner Takes All / Top 3 Split / Split Pot).
 */
export interface PrizeRule {
  id: string;
  title: string;
  description: string;
  /** Icon rendered inside the card's dark chip (e.g. a lucide icon element). */
  icon: ReactNode;
  /** Muted pill at the bottom of the card, e.g. "Maximum Competition intensity". */
  tag: string;
  /** Marks the featured card with a top-right "Recommended" pill. */
  recommended?: boolean;
}

export interface PrizeRuleCardProps {
  rule: PrizeRule;
  /** Selected cards get a primary border + drop shadow. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  className?: string;
}
