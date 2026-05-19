/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type FeedCaptionProps = Readonly<{
  text: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function FeedCaption({ text }: FeedCaptionProps) {
  return (
    <Typography as="p" variant="body" className="max-w-xl text-white">
      {text}
    </Typography>
  );
}
/** ################################ /COMPONENT ############################# */
