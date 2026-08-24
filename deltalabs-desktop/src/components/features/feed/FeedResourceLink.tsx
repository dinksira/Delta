/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/features/feed/primitives";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedResourceLinkProps = Readonly<{
  text: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedResourceLink({ text }: FeedResourceLinkProps) {
  return (
    <Typography as="p" variant="small" className="mt-3 text-white/90">
      {text}
    </Typography>
  );
}
/** ################################ /COMPONENT ############################# */
