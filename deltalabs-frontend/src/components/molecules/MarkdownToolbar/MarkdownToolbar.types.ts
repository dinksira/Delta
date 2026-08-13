/** Commands a MarkdownToolbar can emit; the editor maps them to markdown edits. */
export type MarkdownToolbarCommand =
  | { id: "h1" | "h2" | "h3" }
  | { id: "bold" | "italic" | "strikethrough" | "inlineCode" }
  | { id: "codeBlock" }
  | { id: "blockquote" | "unorderedList" | "orderedList" }
  | { id: "link" }
  | { id: "image" }
  | { id: "table" };

export interface MarkdownToolbarProps {
  /** Emits a command; the consuming editor turns it into a markdown edit at the caret. */
  onCommand: (command: MarkdownToolbarCommand) => void;
  disabled?: boolean;
  className?: string;
}