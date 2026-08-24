/**
 * MarkdownToolbar — formatting toolbar for the Markdown Pad editor.
 *
 * A compact, presentational button rail (H1/H2/H3, bold/italic/strikethrough,
 * inline code, code block, blockquote, lists, link, image, table) built from the
 * same chrome as the RichTextEditor toolbar. Buttons only emit a typed command;
 * the consuming `MarkdownEditor` translates the command into a caret-aware
 * markdown edit. Colors come from design tokens only.
 *
 * @example
 * <MarkdownToolbar onCommand={(cmd) => editor.apply(cmd)} />
 */

import type { ReactNode } from "react";
import {
  Bold,
  Braces,
  Image,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Table,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { MarkdownToolbarCommand, MarkdownToolbarProps } from "./MarkdownToolbar.types";

interface ToolbarItem {
  id: MarkdownToolbarCommand["id"];
  label: string;
  command: MarkdownToolbarCommand;
  icon?: ReactNode;
  /** Rendered as plain text when no icon (H1/H2/H3 pills). */
  text?: string;
}

const TOOLBAR_ITEMS: ToolbarItem[] = [
  { id: "h1", label: "Heading 1", text: "H1", command: { id: "h1" } },
  { id: "h2", label: "Heading 2", text: "H2", command: { id: "h2" } },
  { id: "h3", label: "Heading 3", text: "H3", command: { id: "h3" } },
  { id: "bold", label: "Bold", icon: <Bold className="size-4" aria-hidden />, command: { id: "bold" } },
  {
    id: "italic",
    label: "Italic",
    icon: <Italic className="size-4" aria-hidden />,
    command: { id: "italic" },
  },
  {
    id: "strikethrough",
    label: "Strikethrough",
    icon: <Strikethrough className="size-4" aria-hidden />,
    command: { id: "strikethrough" },
  },
  {
    id: "inlineCode",
    label: "Inline code",
    icon: <Braces className="size-4" aria-hidden />,
    command: { id: "inlineCode" },
  },
  {
    id: "codeBlock",
    label: "Code block",
    icon: <Braces className="size-4" aria-hidden />,
    command: { id: "codeBlock" },
  },
  {
    id: "blockquote",
    label: "Blockquote",
    icon: <Quote className="size-4" aria-hidden />,
    command: { id: "blockquote" },
  },
  {
    id: "unorderedList",
    label: "Bulleted list",
    icon: <List className="size-4" aria-hidden />,
    command: { id: "unorderedList" },
  },
  {
    id: "orderedList",
    label: "Numbered list",
    icon: <ListOrdered className="size-4" aria-hidden />,
    command: { id: "orderedList" },
  },
  {
    id: "link",
    label: "Link",
    icon: <Link2 className="size-4" aria-hidden />,
    command: { id: "link" },
  },
  {
    id: "image",
    label: "Image",
    icon: <Image className="size-4" aria-hidden />,
    command: { id: "image" },
  },
  {
    id: "table",
    label: "Table",
    icon: <Table className="size-4" aria-hidden />,
    command: { id: "table" },
  },
];

function ToolbarButton({
  label,
  disabled,
  onClick,
  children,
}: Readonly<{
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-default hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function MarkdownToolbar({
  onCommand,
  disabled = false,
  className,
}: Readonly<MarkdownToolbarProps>) {
  return (
    <div
      role="toolbar"
      aria-label="Markdown formatting tools"
      className={cn(
        "flex flex-wrap items-center gap-1 border-b border-border-default bg-surface-muted px-2 py-1.5",
        className,
      )}
    >
      {TOOLBAR_ITEMS.map((item, index) => {
        const isPill = Boolean(item.text);
        return (
          <span key={item.id} className="contents">
            {index === 3 || index === 6 || index === 11 ? (
              <div aria-hidden className="mx-1 h-4 w-px bg-border-default" />
            ) : null}
            <ToolbarButton
              label={item.label}
              disabled={disabled}
              onClick={() => onCommand(item.command)}
            >
              {isPill ? (
                <span className="px-1 text-xs font-bold text-text-secondary">{item.text}</span>
              ) : (
                item.icon
              )}
            </ToolbarButton>
          </span>
        );
      })}
    </div>
  );
}

export default MarkdownToolbar;