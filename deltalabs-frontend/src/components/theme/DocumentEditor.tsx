"use client";

/**
 * Shared Delta Labs block document editor (slash commands + selection bubble).
 * Feature-agnostic HTML editor for summaries, notes, and similar surfaces.
 */

import {
  Bold,
  CheckSquare,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Minus,
  Quote,
  Table,
  Type,
  Underline,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  type RefObject,
} from "react";

import { cx } from "@/components/theme/utils";

type SlashItem = {
  id: string;
  label: string;
  hint: string;
  keywords: string;
  icon: typeof Type;
  html: string;
};

/** Reusable block HTML snippets for slash menu and toolbars. */
export const DOCUMENT_BLOCK_HTML = {
  text: "<p> </p>",
  title: "<h1> </h1>",
  heading: "<h2> </h2>",
  subheading: "<h3> </h3>",
  bullets: "<ul><li> </li></ul>",
  numbered: "<ol><li> </li></ol>",
  todo: `<div data-todo="1" style="display:flex;gap:8px;align-items:flex-start;margin:2px 0"><input type="checkbox" contenteditable="false"/><div data-todo-text="1" style="flex:1;outline:none"> </div></div>`,
  callout: `<div data-callout="1" style="margin:6px 0;padding:10px 12px;border-radius:6px;background:#f1f5f9;border-left:3px solid #0f766e"><p> </p></div>`,
  quote: "<blockquote> </blockquote>",
  divider: "<hr/>",
  table: `<table style="width:100%;border-collapse:collapse;margin:8px 0"><thead><tr><th style="border:1px solid #d0d7de;padding:6px 8px;background:#f6f8fa;text-align:left"> </th><th style="border:1px solid #d0d7de;padding:6px 8px;background:#f6f8fa;text-align:left"> </th></tr></thead><tbody><tr><td style="border:1px solid #d0d7de;padding:6px 8px"> </td><td style="border:1px solid #d0d7de;padding:6px 8px"> </td></tr></tbody></table><p> </p>`,
} as const;

const SLASH_ITEMS: SlashItem[] = [
  {
    id: "text",
    label: "Text",
    hint: "Plain paragraph",
    keywords: "text paragraph p body",
    icon: Type,
    html: DOCUMENT_BLOCK_HTML.text,
  },
  {
    id: "title",
    label: "Title",
    hint: "Big section title",
    keywords: "title h1",
    icon: Heading1,
    html: DOCUMENT_BLOCK_HTML.title,
  },
  {
    id: "heading",
    label: "Heading",
    hint: "Section heading",
    keywords: "heading h2",
    icon: Heading2,
    html: DOCUMENT_BLOCK_HTML.heading,
  },
  {
    id: "subheading",
    label: "Subheading",
    hint: "Smaller heading",
    keywords: "subheading h3",
    icon: Heading2,
    html: DOCUMENT_BLOCK_HTML.subheading,
  },
  {
    id: "bullets",
    label: "Bulleted list",
    hint: "• List item",
    keywords: "bullet list ul unordered",
    icon: List,
    html: DOCUMENT_BLOCK_HTML.bullets,
  },
  {
    id: "numbered",
    label: "Numbered list",
    hint: "1. List item",
    keywords: "numbered list ol ordered",
    icon: ListOrdered,
    html: DOCUMENT_BLOCK_HTML.numbered,
  },
  {
    id: "todo",
    label: "To-do",
    hint: "Checkbox mark",
    keywords: "todo task check mark checkbox",
    icon: CheckSquare,
    html: DOCUMENT_BLOCK_HTML.todo,
  },
  {
    id: "callout",
    label: "Callout",
    hint: "Highlighted block",
    keywords: "callout highlight note mark box",
    icon: Highlighter,
    html: DOCUMENT_BLOCK_HTML.callout,
  },
  {
    id: "quote",
    label: "Quote",
    hint: "Capture a quote",
    keywords: "quote blockquote",
    icon: Quote,
    html: DOCUMENT_BLOCK_HTML.quote,
  },
  {
    id: "divider",
    label: "Divider",
    hint: "Visual separator",
    keywords: "divider line hr",
    icon: Minus,
    html: DOCUMENT_BLOCK_HTML.divider,
  },
  {
    id: "table",
    label: "Table",
    hint: "2 × 2 table",
    keywords: "table grid",
    icon: Table,
    html: DOCUMENT_BLOCK_HTML.table,
  },
];

export type DocumentEditorProps = Readonly<{
  editorRef: RefObject<HTMLDivElement | null>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  onChange: () => void;
  /** Optional; defaults to document.execCommand on the editor. */
  runCmd?: (command: string, value?: string) => void;
}>;

/** Run a formatting command against a document editor root. */
export function runDocumentCommand(
  editor: HTMLDivElement | null | undefined,
  command: string,
  value?: string,
): void {
  editor?.focus();
  document.execCommand(command, false, value);
}

/** Insert HTML at the caret inside a document editor root. */
export function insertDocumentHtml(
  editor: HTMLDivElement | null | undefined,
  html: string,
): void {
  editor?.focus();
  document.execCommand("insertHTML", false, html);
}

/** Shared Delta Labs block document editor. */
export function DocumentEditor({
  editorRef,
  disabled = false,
  placeholder = "Type '/' for blocks — title, list, table, callout…",
  className,
  onChange,
  runCmd: runCmdProp,
}: DocumentEditorProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [slashOpen, setSlashOpen] = useState(false);
  const [slashQuery, setSlashQuery] = useState("");
  const [slashIndex, setSlashIndex] = useState(0);
  const [slashPos, setSlashPos] = useState({ top: 0, left: 0 });
  const slashRangeRef = useRef<Range | null>(null);
  const [bubble, setBubble] = useState<{ top: number; left: number } | null>(null);

  const runCmd = useCallback(
    (command: string, value?: string) => {
      if (disabled) return;
      if (runCmdProp) {
        runCmdProp(command, value);
        return;
      }
      runDocumentCommand(editorRef.current, command, value);
      onChange();
    },
    [disabled, editorRef, onChange, runCmdProp],
  );

  const filtered = useMemo(() => {
    const q = slashQuery.trim().toLowerCase();
    if (!q) return SLASH_ITEMS;
    return SLASH_ITEMS.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords.includes(q) ||
        item.hint.toLowerCase().includes(q),
    );
  }, [slashQuery]);

  useEffect(() => {
    setSlashIndex(0);
  }, [slashQuery]);

  const closeSlash = useCallback(() => {
    setSlashOpen(false);
    setSlashQuery("");
    slashRangeRef.current = null;
  }, []);

  const insertHtml = useCallback(
    (html: string) => {
      if (disabled) return;
      insertDocumentHtml(editorRef.current, html);
      onChange();
    },
    [disabled, editorRef, onChange],
  );

  const applySlashItem = useCallback(
    (item: SlashItem) => {
      const sel = window.getSelection();
      const range = slashRangeRef.current;
      if (sel && range) {
        try {
          const end = sel.rangeCount ? sel.getRangeAt(0).endContainer : range.endContainer;
          const endOffset = sel.rangeCount ? sel.getRangeAt(0).endOffset : range.endOffset;
          const wipe = range.cloneRange();
          wipe.setEnd(end, endOffset);
          wipe.deleteContents();
          sel.removeAllRanges();
          sel.addRange(wipe);
        } catch {
          // fall through
        }
      }
      insertHtml(item.html);
      closeSlash();
    },
    [closeSlash, insertHtml],
  );

  const updateBubble = useCallback(() => {
    if (disabled) {
      setBubble(null);
      return;
    }
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount) {
      setBubble(null);
      return;
    }
    const root = editorRef.current;
    if (!root || !root.contains(sel.anchorNode)) {
      setBubble(null);
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    const wrap = wrapRef.current?.getBoundingClientRect();
    if (!wrap || rect.width === 0) {
      setBubble(null);
      return;
    }
    setBubble({
      top: rect.top - wrap.top - 40,
      left: Math.max(8, rect.left - wrap.left + rect.width / 2 - 90),
    });
  }, [disabled, editorRef]);

  useLayoutEffect(() => {
    const onSel = () => updateBubble();
    document.addEventListener("selectionchange", onSel);
    return () => document.removeEventListener("selectionchange", onSel);
  }, [updateBubble]);

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (slashOpen) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeSlash();
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSlashIndex((i) => Math.min(i + 1, Math.max(filtered.length - 1, 0)));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSlashIndex((i) => Math.max(i - 1, 0));
        return;
      }
      if (e.key === "Enter" && filtered[slashIndex]) {
        e.preventDefault();
        applySlashItem(filtered[slashIndex]!);
        return;
      }
      if (e.key === "Backspace" && slashQuery === "") {
        closeSlash();
        return;
      }
    }

    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
      requestAnimationFrame(() => {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount || !editorRef.current) return;
        const range = sel.getRangeAt(0).cloneRange();
        try {
          if (range.startOffset > 0) {
            range.setStart(range.startContainer, range.startOffset - 1);
          }
        } catch {
          /* ignore */
        }
        slashRangeRef.current = range;
        const rect = sel.getRangeAt(0).getBoundingClientRect();
        const wrap = wrapRef.current?.getBoundingClientRect();
        if (wrap) {
          setSlashPos({
            top: rect.bottom - wrap.top + 6,
            left: Math.max(8, rect.left - wrap.left),
          });
        }
        setSlashQuery("");
        setSlashOpen(true);
      });
    }
  };

  const onInput = () => {
    onChange();
    if (!slashOpen) return;
    const sel = window.getSelection();
    const start = slashRangeRef.current;
    if (!sel || !sel.rangeCount || !start) {
      closeSlash();
      return;
    }
    try {
      const probe = start.cloneRange();
      probe.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
      const text = probe.toString();
      if (!text.startsWith("/")) {
        closeSlash();
        return;
      }
      setSlashQuery(text.slice(1));
    } catch {
      closeSlash();
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      {bubble ? (
        <div
          className="absolute z-20 flex items-center gap-0.5 rounded-md border border-border-default bg-surface-default px-1 py-0.5 shadow-md"
          style={{ top: bubble.top, left: bubble.left }}
          onMouseDown={(e) => e.preventDefault()}
        >
          <BubbleBtn label="Bold" onClick={() => runCmd("bold")}>
            <Bold className="size-3.5" />
          </BubbleBtn>
          <BubbleBtn label="Italic" onClick={() => runCmd("italic")}>
            <Italic className="size-3.5" />
          </BubbleBtn>
          <BubbleBtn label="Underline" onClick={() => runCmd("underline")}>
            <Underline className="size-3.5" />
          </BubbleBtn>
          <BubbleBtn label="Highlight" onClick={() => runCmd("hiliteColor", "#fef08a")}>
            <Highlighter className="size-3.5" />
          </BubbleBtn>
          <BubbleBtn
            label="Link"
            onClick={() => {
              const url = window.prompt("Link URL", "https://");
              if (url?.trim()) runCmd("createLink", url.trim());
            }}
          >
            <Link2 className="size-3.5" />
          </BubbleBtn>
        </div>
      ) : null}

      {slashOpen ? (
        <div
          className="absolute z-30 w-64 overflow-hidden rounded-lg border border-border-default bg-surface-default shadow-lg"
          style={{ top: slashPos.top, left: slashPos.left }}
          role="listbox"
        >
          <p className="border-b border-border-default px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-text-secondary">
            Basic blocks
          </p>
          <ul className="max-h-64 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-xs text-text-secondary">No matches</li>
            ) : (
              filtered.map((item, i) => {
                const Icon = item.icon;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={i === slashIndex}
                      className={cx(
                        "flex w-full items-center gap-2 px-2.5 py-1.5 text-left",
                        i === slashIndex ? "bg-surface-muted" : "hover:bg-surface-muted/70",
                      )}
                      onMouseEnter={() => setSlashIndex(i)}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => applySlashItem(item)}
                    >
                      <span className="inline-flex size-7 shrink-0 items-center justify-center rounded border border-border-default bg-surface-default text-text-secondary">
                        <Icon className="size-3.5" aria-hidden />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-medium text-text-primary">{item.label}</span>
                        <span className="block truncate text-[10px] text-text-secondary">{item.hint}</span>
                      </span>
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}

      <div
        ref={editorRef}
        role="textbox"
        aria-multiline
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className={cx(
          "dl-document-editor min-h-[12rem] text-[15px] leading-[1.55] text-text-primary outline-none",
          "empty:before:pointer-events-none empty:before:text-text-secondary/60 empty:before:content-[attr(data-placeholder)]",
          "[&_h1]:mb-1 [&_h1]:mt-3 [&_h1]:text-[1.75rem] [&_h1]:font-bold [&_h1]:leading-tight [&_h1]:tracking-tight",
          "[&_h2]:mb-1 [&_h2]:mt-2.5 [&_h2]:text-[1.35rem] [&_h2]:font-semibold [&_h2]:leading-snug",
          "[&_h3]:mb-0.5 [&_h3]:mt-2 [&_h3]:text-[1.1rem] [&_h3]:font-semibold",
          "[&_p]:my-0.5 [&_p]:min-h-[1.4em]",
          "[&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-6",
          "[&_ol]:my-1 [&_ol]:list-decimal [&_ol]:pl-6",
          "[&_li]:my-0.5",
          "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-border-default [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-text-secondary",
          "[&_hr]:my-3 [&_hr]:border-0 [&_hr]:border-t [&_hr]:border-border-default",
          "[&_a]:text-primary-700 [&_a]:underline",
          "[&_mark]:rounded-sm [&_mark]:bg-[#fef08a] [&_mark]:px-0.5",
          "[&_table]:my-2 [&_th]:font-semibold",
          className,
        )}
        onKeyDown={onKeyDown}
        onInput={onInput}
        onClick={(e) => {
          const t = e.target as HTMLElement;
          if (t.tagName === "INPUT" && (t as HTMLInputElement).type === "checkbox") {
            onChange();
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (!wrapRef.current?.contains(document.activeElement)) {
              closeSlash();
              setBubble(null);
            }
          }, 120);
        }}
      />
    </div>
  );
}

function BubbleBtn({
  children,
  label,
  onClick,
}: Readonly<{
  children: ReactNode;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className="inline-flex size-7 items-center justify-center rounded text-text-secondary hover:bg-surface-muted"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
