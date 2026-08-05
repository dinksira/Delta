import type { ReactNode } from "react";

/**
 * One selectable timing option for the Create Topic Battle wizard
 * (match type step → "When to start Battle"). Ids map to
 * `draft.visibility.timing` (`instant` | `schedule`).
 */
export interface TimingOption {
  id: string;
  title: string;
  description: string;
  /** Icon rendered inside the card's dark chip (e.g. a lucide icon element). */
  icon: ReactNode;
}

export interface TimingOptionCardProps {
  option: TimingOption;
  /** Selected cards get a primary border + drop shadow. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  className?: string;
}
