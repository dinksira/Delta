/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedHashtagListProps = Readonly<{
  hashtags: readonly string[];
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedHashtagList({ hashtags }: FeedHashtagListProps) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
      {hashtags.map((tag) => (
        <Typography key={tag} as="span" variant="small" className="text-white/95">
          #{tag}
        </Typography>
      ))}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
