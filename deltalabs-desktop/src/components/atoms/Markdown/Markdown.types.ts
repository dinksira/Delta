export interface MarkdownProps {
  /** Raw markdown source to render after conversion + sanitization. */
  source: string;
  /** Extra classes; consumer controls size/weight (e.g. `text-lg font-semibold`). */
  className?: string;
}