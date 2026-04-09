/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedFilterPanelProps = Readonly<{
  id: string;
  isOpen: boolean;
}>;

/** ################################ /TYPES ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const chips = ["Video", "Audio", "AI", "Simulation", "Labs"] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedFilterPanel({ id, isOpen }: FeedFilterPanelProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <section
      id={id}
      aria-label="Feed filters"
      className="mt-2 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm"
    >
      <Typography as="h2" variant="label" className="mb-3">
        Categories
      </Typography>
      <div className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip}
            type="button"
            className="inline-flex h-8 items-center rounded-full border border-border-default bg-surface-muted px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}
/** ################################ /COMPONENT ############################# */
