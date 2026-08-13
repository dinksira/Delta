/**
 * Markdown — renders sanitized markdown for participants and author previews.
 *
 * Wraps `dangerouslySetInnerHTML` behind a two-stage pipeline: `renderMarkdown`
 * converts the source subset to HTML, then `sanitizeRichText` strips dangerous
 * tags/attributes (script, style, event handlers, `javascript:` links) so
 * authored prose can be shown without running dangerous markup. The `Markdown`
 * atom is the Markdown Pad counterpart of the `RichText` atom.
 *
 * @example
 * ```tsx
 * <Markdown source={question.markdown.source} className="text-lg" />
 * ```
 */

import { useMemo } from "react";

import { MarkdownProps } from "./Markdown.types";
import { renderMarkdown } from "@/lib/markdown";
import { sanitizeRichText } from "@/lib/richText";
import { cn } from "@/lib/utils";

/** Block-level styling for rendered markdown, expressed with design tokens. */
export const MARKDOWN_CLASSES =
  "break-words text-text-primary " +
  "[&_h1]:mb-3 [&_h1]:mt-2 [&_h1]:text-2xl [&_h1]:font-bold " +
  "[&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:text-xl [&_h2]:font-bold " +
  "[&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:text-lg [&_h3]:font-bold " +
  "[&_h4]:mb-1 [&_h4]:mt-2 [&_h4]:text-base [&_h4]:font-bold " +
  "[&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-sm [&_h5]:font-bold " +
  "[&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-xs [&_h6]:font-bold " +
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 " +
  "[&_li]:my-0.5 " +
  "[&_strong]:font-bold [&_em]:italic [&_del]:line-through " +
  "[&_code]:rounded [&_code]:bg-surface-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs " +
  "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-muted [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs " +
  "[&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-sm " +
  "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 " +
  "[&_blockquote]:bg-primary-50 [&_blockquote]:px-3 [&_blockquote]:py-1 [&_blockquote]:text-text-secondary " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm " +
  "[&_th]:border [&_th]:border-border-default [&_th]:bg-surface-muted [&_th]:px-3 [&_th]:py-1.5 " +
  "[&_th]:text-left [&_th]:font-semibold " +
  "[&_td]:border [&_td]:border-border-default [&_td]:px-3 [&_td]:py-1.5 " +
  "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-lg " +
  "[&_a]:text-primary-600 [&_a]:underline hover:[&_a]:text-primary-700 " +
  "[&_hr]:my-4 [&_hr]:border-t [&_hr]:border-border-default";

/** Render a markdown source string as sanitized HTML. */
export function Markdown({ source, className }: MarkdownProps) {
  const html = useMemo(() => sanitizeRichText(renderMarkdown(source ?? "")), [source]);

  return (
    <div
      className={cn(MARKDOWN_CLASSES, className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export default Markdown;