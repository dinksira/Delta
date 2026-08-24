import type { ReactNode } from "react";

/**
 * One selectable battle format for the Create Topic Battle wizard
 * (battle format step). Shape follows the Step 2 redesign spec:
 * `metrics` (players/duration), a feature checklist, and a dark
 * "Tournament Structure" chip track.
 */
export interface BattleFormat {
  id: string;
  title: string;
  description: string;
  /** Icon rendered inside the card's dark square chip (e.g. a lucide icon element). */
  icon: ReactNode;
  /** Metric pill values, e.g. `{ players: "2 Players", duration: "5 min" }`. */
  metrics: {
    players: string;
    duration: string;
  };
  /** Feature checklist lines rendered with a checkmark. */
  features: string[];
  /** Label above the structure chip track, e.g. "Tournament Structure". */
  structureLabel: string;
  /** Pills rendered in the structure track (e.g. `["1", "2", "3", "4"]`). */
  chips: string[];
  /** Rendered between consecutive chips (e.g. "vs" for the 1v1 duel). */
  chipsSeparator?: string;
  /** Floating "Recommended" badge in the top-right corner. */
  recommended?: boolean;
}

export interface BattleFormatCardProps {
  format: BattleFormat;
  /** Selected cards get a primary border + drop shadow. */
  selected?: boolean;
  /** Fired on click when provided; card is non-interactive otherwise. */
  onSelect?: (id: string) => void;
  className?: string;
}
