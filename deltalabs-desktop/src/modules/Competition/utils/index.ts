/**
 * Competition utils
 * Mappers and formatters for competition data.
 */

import type { CompetitionCategory } from "@/modules/Competition/types";

const categoryLabelMap: Record<CompetitionCategory, string> = {
  active: "Active Competition",
  recent: "Recent Competition",
  community: "Community Competition",
};

export function getCategoryLabel(category: CompetitionCategory): string {
  return categoryLabelMap[category];
}

export function formatEndsDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
