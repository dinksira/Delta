/**
 * Props for the PrizePoolCounter molecule.
 *
 * Counter card for the Create Topic Battle wizard (prize rules step):
 * − / amount / ＋ controls over the total prize pool with a
 * "Total Prize Pool Available" caption.
 */
export interface PrizePoolCounterProps {
  /** Current prize pool in ETB (clamped to min/max). */
  value: number;
  /** Fired with the new amount on each step. */
  onChange: (value: number) => void;
  /** Lower clamp (buttons disabled at it). */
  min?: number;
  /** Optional upper clamp; no cap when omitted. */
  max?: number;
  /** Increment/decrement step. */
  step?: number;
  className?: string;
}
