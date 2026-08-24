import type { ReactNode } from "react";

/**
 * One selectable match type for the Create Topic Battle wizard
 * (match type step). Follows the Step 3 redesign spec:
 * Public Match / Private Match with features and a "Best for" label.
 */
export interface MatchVisibility {
  id: string;
  title: string;
  description: string;
  /** Icon rendered inside the card's chip (e.g. a lucide icon element). */
  icon: ReactNode;
  /** Feature checklist lines rendered with a checkmark. */
  features: string[];
  /** Short audience hint, e.g. "Competitive Play". */
  bestFor: string;
}

export interface MatchVisibilityCardProps {
  visibility: MatchVisibility;
  /** Selected cards get a primary border + drop shadow. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  className?: string;
}
