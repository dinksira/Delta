/**
 * RichTextEditor — rich-text question-text editor for every quiz question type.
 *
 * A compact toolbar (Undo/Redo, text style, Bold / Italic / Underline /
 * Strikethrough / Highlight, bulleted & numbered lists) sits above a
 * `contentEditable` surface. When `insertBlankButton` is set (fill-in-the-blank
 * stems) a mini dashed "Blank" pill appears in the toolbar that inserts a
 * styled `<span data-blank>` marker at the caret. Emits HTML via `onChange`;
 * the same content renders for participants through the `RichText` atom.
 */

"use client";

import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  Link,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { RICH_TEXT_CLASSES } from "@/components/atoms/RichText/RichText";
import { BLANK_GLYPH, BLANK_SPAN_TAG, sanitizeRichText } from "@/lib/richText";
import { cn } from "@/lib/utils";

export interface RichTextEditorProps {
  /** Authored question text as an HTML string. */
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Show the mini "Blank" pill that inserts a `data-blank` marker at the caret. */
  insertBlankButton?: boolean;
  disabled?: boolean;
  /** Associates the `Field` label with the editor surface. */
  id?: string;
  className?: string;
}

/** Highlight marker color passed to `hiliteColor`, then normalized to `<mark>`. */
const HIGHLIGHT_COLOR = "#fde68a";

interface FormatItem {
  key:
    | "bold"
    | "italic"
    | "underline"
    | "strikethrough"
    | "highlight"
    | "unorderedList"
    | "orderedList"
    | "alignLeft"
    | "alignCenter"
    | "alignRight";
  label: string;
  icon: LucideIcon;
  command: string;
}

const FORMAT_ITEMS: FormatItem[] = [
  { key: "bold", label: "Bold", icon: Bold, command: "bold" },
  { key: "italic", label: "Italic", icon: Italic, command: "italic" },
  { key: "underline", label: "Underline", icon: Underline, command: "underline" },
  {
    key: "strikethrough",
    label: "Strikethrough",
    icon: Strikethrough,
    command: "strikeThrough",
  },
  { key: "highlight", label: "Highlight", icon: Highlighter, command: "hiliteColor" },
  {
    key: "unorderedList",
    label: "Bulleted list",
    icon: List,
    command: "insertUnorderedList",
  },
  { key: "orderedList", label: "Numbered list", icon: ListOrdered, command: "insertOrderedList" },
  { key: "alignLeft", label: "Align left", icon: AlignLeft, command: "justifyLeft" },
  { key: "alignCenter", label: "Align center", icon: AlignCenter, command: "justifyCenter" },
  { key: "alignRight", label: "Align right", icon: AlignRight, command: "justifyRight" },
];

/** The `<mark>` nearest the current selection, or null when outside one. */
function findClosestMark(root: HTMLElement): HTMLElement | null {
  if (typeof window === "undefined") return null;
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  const anchor =
    selection.anchorNode instanceof Element
      ? selection.anchorNode
      : (selection.anchorNode?.parentElement ?? null);
  if (!anchor || !root.contains(anchor)) return null;
  return anchor instanceof Element ? anchor.closest("mark") : null;
}

/** Normalize `hiliteColor` spans (Chrome) into clean `<mark>` elements. */
function normalizeHighlights(root: HTMLElement): void {
  for (const span of Array.from(root.querySelectorAll("span[style]"))) {
    const style = (span as HTMLElement).style;
    const hasBackground = Boolean(style.backgroundColor) && style.backgroundColor !== "transparent";
    const hasOtherStyles = style.cssText.replace(/background-color:[^;]+;?/gi, "").trim();
    if (hasBackground && !hasOtherStyles) {
      const mark = document.createElement("mark");
      mark.innerHTML = span.innerHTML;
      span.replaceWith(mark);
    }
  }
}

function ToolbarButton({
  label,
  active = false,
  disabled,
  onClick,
  children,
}: Readonly<{
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}>) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      title={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-default hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-primary-100 aria-pressed:text-primary-700"
    >
      {children}
    </button>
  );
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write the question players will see…",
  insertBlankButton = false,
  disabled = false,
  id,
  className,
}: Readonly<RichTextEditorProps>) {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const [active, setActive] = useState<Record<string, boolean>>({});

  const refreshActive = useCallback(() => {
    const editor = editorRef.current;
    if (!editor || typeof document === "undefined") return;
    const next: Record<string, boolean> = {};
    for (const item of FORMAT_ITEMS) {
      next[item.key] =
        item.key === "highlight"
          ? Boolean(findClosestMark(editor))
          : document.queryCommandState(item.command);
    }
    setActive((prev) =>
      FORMAT_ITEMS.some((item) => prev[item.key] !== next[item.key]) ? next : prev,
    );
  }, []);

  const handleInput = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;
    normalizeHighlights(editor);
    onChange(editor.innerHTML);
    refreshActive();
  }, [onChange, refreshActive]);

  const handlePaste = useCallback(
    (event: React.ClipboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      event.preventDefault();
      const html = event.clipboardData?.getData("text/html");
      const plain = event.clipboardData?.getData("text/plain");
      const content = html ? sanitizeRichText(html) : plain;
      if (content && editorRef.current) {
        document.execCommand("insertHTML", false, content);
        handleInput();
      }
    },
    [disabled, handleInput],
  );

  const runCommand = useCallback(
    (command: string, value?: string) => {
      if (disabled) return;
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();
      document.execCommand(command, false, value);
      handleInput();
    },
    [disabled, handleInput],
  );

  const toggleHighlight = useCallback(() => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    const existing = findClosestMark(editor);
    if (existing) {
      existing.replaceWith(...Array.from(existing.childNodes));
    } else {
      document.execCommand("hiliteColor", false, HIGHLIGHT_COLOR);
    }
    handleInput();
  }, [disabled, handleInput]);

  const insertBlank = useCallback(() => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    editor.focus();
    document.execCommand("insertHTML", false, BLANK_SPAN_TAG);
    handleInput();
  }, [disabled, handleInput]);

  const insertLink = useCallback(() => {
    if (disabled) return;
    const editor = editorRef.current;
    if (!editor) return;
    const url = window.prompt("Link URL", "https://");
    if (!url) return;
    editor.focus();
    document.execCommand("createLink", false, url);
    handleInput();
  }, [disabled, handleInput]);

  useEffect(() => {
    const editor = editorRef.current;
    if (editor && editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    document.addEventListener("selectionchange", refreshActive);
    return () => document.removeEventListener("selectionchange", refreshActive);
  }, [refreshActive]);

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border border-border-default bg-surface-default shadow-sm transition-colors focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200",
        className,
      )}
    >
      <div
        role="toolbar"
        aria-label="Formatting tools"
        className="flex flex-wrap items-center gap-1 border-b border-border-default bg-surface-muted px-2 py-1.5"
      >
        <ToolbarButton label="Undo" disabled={disabled} onClick={() => runCommand("undo")}>
          <Undo2 className="size-4" aria-hidden />
        </ToolbarButton>
        <ToolbarButton label="Redo" disabled={disabled} onClick={() => runCommand("redo")}>
          <Redo2 className="size-4" aria-hidden />
        </ToolbarButton>

        <div aria-hidden className="mx-1 h-4 w-px bg-border-default" />

        <select
          aria-label="Text style"
          defaultValue="p"
          disabled={disabled}
          onChange={(event) => runCommand("formatBlock", event.target.value)}
          className="h-7 rounded-md border border-transparent bg-transparent px-1 text-xs font-medium text-text-secondary outline-none transition-colors hover:bg-surface-default disabled:cursor-not-allowed disabled:opacity-50"
        >
          <option value="p">Normal text</option>
          <option value="h3">Heading</option>
        </select>

        {FORMAT_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <ToolbarButton
              key={item.key}
              label={item.label}
              active={active[item.key]}
              disabled={disabled}
              onClick={() =>
                item.key === "highlight" ? toggleHighlight() : runCommand(item.command)
              }
            >
              <Icon className="size-4" aria-hidden />
            </ToolbarButton>
          );
        })}

        <div aria-hidden className="mx-1 h-4 w-px bg-border-default" />
        <ToolbarButton label="Insert link" disabled={disabled} onClick={insertLink}>
          <Link className="size-4" aria-hidden />
        </ToolbarButton>

        {insertBlankButton && (
          <>
            <div aria-hidden className="mx-1 h-4 w-px bg-border-default" />
            <button
              type="button"
              disabled={disabled}
              title="Insert a blank marker"
              onMouseDown={(event) => event.preventDefault()}
              onClick={insertBlank}
              className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary-400 bg-primary-50 px-2.5 py-1 text-xs font-semibold text-primary-700 transition-colors hover:bg-primary-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span aria-hidden className="font-mono text-primary-500">
                {BLANK_GLYPH}
              </span>
              Blank
            </button>
          </>
        )}
      </div>

      <div
        ref={editorRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        contentEditable={!disabled}
        spellCheck
        data-placeholder={placeholder}
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyUp={refreshActive}
        onMouseUp={refreshActive}
        onClick={refreshActive}
        onPaste={handlePaste}
        className={cn(
          "min-h-28 max-h-56 overflow-y-auto px-3 py-2.5 text-sm outline-none",
          RICH_TEXT_CLASSES,
          "[&:empty:before]:pointer-events-none [&:empty:before]:content-[attr(data-placeholder)] [&:empty:before]:text-text-secondary",
          disabled && "cursor-not-allowed opacity-60",
        )}
      />
    </div>
  );
}
