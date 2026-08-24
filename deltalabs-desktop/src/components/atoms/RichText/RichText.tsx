/**
 * RichText — renders sanitized rich text for participants.
 *
 * Wraps `dangerouslySetInnerHTML` behind a whitelist sanitizer so authored
 * HTML (e.g. bold/italic question stems with `data-blank` markers, lists,
 * headings) can be shown to participants without running dangerous markup.
 *
 * @example
 * ```tsx
 * <RichText html={question.text} className="text-lg font-semibold" />
 * ```
 */

import { cn } from "@/lib/utils";

import { RichTextProps } from "./RichText.types";
import { sanitizeRichText } from "@/lib/richText";

/** Formatting + blank-marker decoration shared by authored question text. */
export const RICH_TEXT_CLASSES =
  "whitespace-pre-wrap break-words text-text-primary " +
  "[&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic " +
  "[&_u]:underline [&_s]:line-through [&_strike]:line-through " +
  "[&_mark]:rounded-sm [&_mark]:bg-warning-200 [&_mark]:px-0.5 " +
  "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-bold " +
  "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_[data-blank]]:mx-0.5 [&_[data-blank]]:inline-flex " +
  "[&_[data-blank]]:min-w-16 [&_[data-blank]]:items-center " +
  "[&_[data-blank]]:justify-center [&_[data-blank]]:rounded-md " +
  "[&_[data-blank]]:border-b-2 [&_[data-blank]]:border-primary-400 " +
  "[&_[data-blank]]:bg-primary-50 [&_[data-blank]]:px-2 " +
  "[&_[data-blank]]:py-0.5 [&_[data-blank]]:font-semibold " +
  "[&_[data-blank]]:text-primary-700/60";

/** Render an HTML string as sanitized rich text. */
export function RichText({ html, className }: RichTextProps) {
  return (
    <div
      className={cn(RICH_TEXT_CLASSES, className)}
      dangerouslySetInnerHTML={{ __html: sanitizeRichText(html) }}
    />
  );
}
