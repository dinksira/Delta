export interface RichTextProps {
  /** Raw authored HTML to render after sanitization. */
  html: string;
  /** Extra classes; consumer controls size/weight (e.g. `text-lg font-semibold`). */
  className?: string;
}
