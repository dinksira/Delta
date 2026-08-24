import type { ReactNode } from "react";

/**
 * One selectable question-source option for the Create Topic Battle wizard
 * (question pool step). Follows the Step 7 redesign spec: circular icon chip,
 * title/description, a feature checklist and a solid slate recommendation
 * tag (Auto-Generated / Custom Questions).
 */
export interface QuestionSource {
  id: string;
  title: string;
  description: string;
  /** Icon rendered inside the card's circular chip (e.g. a lucide icon element). */
  icon: ReactNode;
  /** Feature checklist lines rendered with a checkmark. */
  features: string[];
  /** Recommendation tag rendered as a solid slate pill at the bottom. */
  tag: string;
}

export interface QuestionSourceCardProps {
  source: QuestionSource;
  /** Selected cards get a primary border + drop shadow. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  className?: string;
}
