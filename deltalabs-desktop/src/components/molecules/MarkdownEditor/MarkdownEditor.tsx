/**
 * MarkdownEditor — split-pane markdown composer for the Markdown Pad.
 *
 * Composes the MarkdownToolbar with a Write / Preview / Split view switch.
 * Toolbar commands are turned into caret-aware markdown edits on the raw source
 * (wrap selection, prefix block lines, insert blocks); the Preview pane renders
 * the same value through the sanitizing `Markdown` atom. Fully controlled via
 * `value` + `onChange` (same emit contract as RichTextEditor).
 *
 * @example
 * <MarkdownEditor
 *   id="mpd-source"
 *   value={question.markdown.source}
 *   onChange={(source) => onChange({ markdown: { ...question.markdown, source } })}
 *   placeholder="Write in markdown…"
 * />
 */

"use client";

import { useRef, useState } from "react";
import { Eye, Pencil, Columns2 } from "lucide-react";

import { Markdown } from "@/components/atoms/Markdown/Markdown";
import { MarkdownToolbar } from "@/components/molecules/MarkdownToolbar/MarkdownToolbar";
import type {
  MarkdownToolbarCommand,
  MarkdownToolbarProps,
} from "@/components/molecules/MarkdownToolbar/MarkdownToolbar.types";
import { cn } from "@/lib/utils";

export interface MarkdownEditorProps {
  /** Raw markdown source being edited. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Associates a `Field` label with the textarea. */
  id?: string;
  className?: string;
}

type EditorView = "write" | "preview" | "split";

interface EditResult {
  value: string;
  caret: number;
}

const VIEWS: { id: EditorView; label: string; icon: typeof Pencil }[] = [
  { id: "write", label: "Write", icon: Pencil },
  { id: "preview", label: "Preview", icon: Eye },
  { id: "split", label: "Split", icon: Columns2 },
];

/** Wrap a selection (or the caret) with `prefix`/`suffix`; caret lands between markers when empty. */
function applyWrap(value: string, start: number, end: number, prefix: string, suffix: string): EditResult {
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);
  const next = `${before}${prefix}${selected}${suffix}${after}`;
  const caret = start === end ? start + prefix.length : start + prefix.length + selected.length + suffix.length;
  return { value: next, caret };
}

/** Prefix every line of the block touching the selection with `prefix`. */
function applyPrefixLines(value: string, start: number, end: number, prefix: string): EditResult {
  const blockStart = start === 0 ? 0 : value.lastIndexOf("\n", start - 1) + 1;
  let blockEnd = value.indexOf("\n", end);
  if (blockEnd === -1) {
    blockEnd = value.length;
  }
  const block = value.slice(blockStart, blockEnd);
  const lines = block
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");
  return { value: value.slice(0, blockStart) + lines + value.slice(blockEnd), caret: blockStart + lines.length };
}

/** Insert `text` at the given caret position. */
function applyInsert(value: string, caret: number, text: string): EditResult {
  return { value: value.slice(0, caret) + text + value.slice(caret), caret: caret + text.length };
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write in markdown…",
  disabled = false,
  id,
  className,
}: Readonly<MarkdownEditorProps>) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [view, setView] = useState<EditorView>("split");

  const commit = (result: EditResult) => {
    onChange(result.value);
    const el = textareaRef.current;
    if (el) {
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(result.caret, result.caret);
      });
    }
  };

  const applyCommand: MarkdownToolbarProps["onCommand"] = (command: MarkdownToolbarCommand) => {
    if (disabled) {
      return;
    }
    const el = textareaRef.current;
    const start = el ? el.selectionStart : value.length;
    const end = el ? el.selectionEnd : value.length;
    const selected = value.slice(start, end);

    switch (command.id) {
      case "h1":
      case "h2":
      case "h3":
        commit(applyPrefixLines(value, start, end, `${"#".repeat(Number(command.id.charAt(1)))} `));
        break;
      case "bold":
        commit(applyWrap(value, start, end, "**", selected ? "**" : "text**"));
        break;
      case "italic":
        commit(applyWrap(value, start, end, "*", selected ? "*" : "text*"));
        break;
      case "strikethrough":
        commit(applyWrap(value, start, end, "~~", selected ? "~~" : "text~~"));
        break;
      case "inlineCode":
        commit(applyWrap(value, start, end, "`", selected ? "`" : "code`"));
        break;
      case "codeBlock":
        commit(applyWrap(value, start, end, "\n```\n", selected ? "\n```\n" : "code\n```\n"));
        break;
      case "blockquote":
        commit(applyPrefixLines(value, start, end, "> "));
        break;
      case "unorderedList":
        commit(applyPrefixLines(value, start, end, "- "));
        break;
      case "orderedList":
        commit(applyPrefixLines(value, start, end, "1. "));
        break;
      case "link":
        commit(applyWrap(value, start, end, "[", selected ? "](url)" : "link text](url)"));
        break;
      case "image":
        commit(applyInsert(value, end, "\n![alt text](https://example.com/image.png)\n"));
        break;
      case "table":
        commit(applyInsert(value, end, "\n| Header 1 | Header 2 |\n| --- | --- |\n| Cell 1 | Cell 2 |\n"));
        break;
      default:
        break;
    }
  };

  const renderTextarea = () => (
    <textarea
      ref={textareaRef}
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
      spellCheck
      placeholder={placeholder}
      aria-label="Markdown source"
      className={cn(
        "w-full min-h-28 flex-1 resize-none bg-transparent px-3 py-2.5 font-mono text-xs leading-5 text-text-primary outline-none",
        "placeholder:text-text-secondary focus-visible:outline-none selection:bg-primary-200",
        disabled && "cursor-not-allowed opacity-60",
      )}
    />
  );

  const renderPreview = () => (
    <div className="max-h-56 min-h-28 flex-1 overflow-y-auto px-3 py-2.5">
      {value.trim() ? (
        <Markdown source={value} className="text-sm" />
      ) : (
        <div className="text-xs text-text-secondary">{placeholder}</div>
      )}
    </div>
  );

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-sm transition-colors",
        "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200",
        className,
      )}
    >
      <MarkdownToolbar onCommand={applyCommand} disabled={disabled} />

      <div className="flex flex-wrap items-center gap-1 border-b border-border-default bg-surface-muted/40 p-1">
        {VIEWS.map((option) => {
          const Icon = option.icon;
          const active = view === option.id;
          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => setView(option.id)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                active
                  ? "bg-surface-default text-text-primary shadow-sm ring-1 ring-border-default"
                  : "text-text-tertiary hover:bg-surface-default hover:text-text-primary",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              <Icon className="size-3.5" aria-hidden />
              {option.label}
            </button>
          );
        })}
      </div>

      {view === "split" ? (
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="border-r border-border-default">{renderTextarea()}</div>
          <div>{renderPreview()}</div>
        </div>
      ) : view === "write" ? (
        renderTextarea()
      ) : (
        renderPreview()
      )}
    </div>
  );
}

export default MarkdownEditor;