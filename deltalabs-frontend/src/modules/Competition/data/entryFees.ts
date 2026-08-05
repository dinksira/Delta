/**
 * entryFees data
 * Entry-fee options for the Create Topic Battle wizard (player & entry step).
 * Follows the Step 4 redesign spec: four preset cards in a 2×2 grid
 * (Free + "5 ETB Per Player" marked Popular) plus a custom amount input.
 */

import type { EntryFeeOption } from "@/components/molecules/FeeSelector";

export const ENTRY_FEE_OPTIONS: EntryFeeOption[] = [
  { label: "Free", value: "Free", isPopular: true },
  { label: "5 ETB Per Player", value: 5, isPopular: true },
  { label: "10 ETB Per Player", value: 10 },
  { label: "20 ETB Per Player", value: 20 },
];
