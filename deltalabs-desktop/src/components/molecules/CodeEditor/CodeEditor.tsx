/**
 * CodeEditor
 * Atomic Level: Molecule
 *
 * Lightweight, dependency-friendly code editor surface: a line-number gutter +
 * a transparent <textarea> layered over a Prism-highlighted <pre> overlay, so
 * the author sees syntax-highlighted code while typing. Tab inserts 2 spaces;
 * the gutter and editor share one scroll container.
 *
 * Colors come from design tokens via CodeEditor.theme.css (Prism token classes
 * mapped to --dl-color-* variables) — no raw hex values.
 *
 * @example
 * <CodeEditor
 *   value={question.codeTemplate}
 *   onChange={(code) => onChange({ codeTemplate: code })}
 *   language="python"
 *   placeholder="Starter scaffold…"
 * />
 */

import { useMemo, useRef } from "react";
import Prism from "prismjs";

import { cn } from "@/lib/utils";

import "prismjs/components/prism-markup";
import "prismjs/components/prism-css";
import "prismjs/components/prism-clike";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-python";
import "prismjs/components/prism-java";
import "prismjs/components/prism-c";
import "prismjs/components/prism-cpp";
import "prismjs/components/prism-csharp";
import "prismjs/components/prism-go";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-sql";
import "prismjs/components/prism-markup-templating";
import "prismjs/components/prism-php";

import "./CodeEditor.theme.css";

/** Prism grammar aliases so UI language names map to a loaded grammar. */
const PRISM_ALIASES: Record<string, string> = {
  HTML: "markup",
  CSS: "css",
  JavaScript: "javascript",
  TypeScript: "typescript",
  Python: "python",
  Java: "java",
  "C++": "cpp",
  "C#": "csharp",
  C: "c",
  Go: "go",
  Rust: "rust",
  SQL: "sql",
  PHP: "php",
};

export interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  /** UI language name (e.g. "Python", "C++") resolved to a Prism grammar. */
  language?: string;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder?: string;
  /** Number of blank rows to pad the editor to a minimum height. */
  rows?: number;
  minLines?: number;
  /** 1-based line to flag with an error marker (compile/runtime diagnostics). */
  errorLine?: number | null;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

/** Highlight `code` for a language, guarding against unknown grammars. */
export function highlightCode(code: string, language?: string): string {
  const grammarName = PRISM_ALIASES[language ?? ""] ?? "clike";
  const grammar = Prism.languages[grammarName];
  if (!grammar) {
    return escapeHtml(code);
  }
  try {
    return Prism.highlight(code || "\u00a0", grammar, grammarName);
  } catch {
    return escapeHtml(code);
  }
}

function escapeHtml(code: string): string {
  return code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function CodeEditor({
  value,
  onChange,
  language,
  readOnly = false,
  disabled = false,
  placeholder,
  rows = 8,
  minLines,
  errorLine,
  id,
  "aria-label": ariaLabel,
  className,
}: Readonly<CodeEditorProps>) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lineCount = useMemo(() => {
    const count = Math.max(1, value.split("\n").length);
    const floor = minLines ?? rows;
    return Math.max(count, floor);
  }, [value, minLines, rows]);

  const highlighted = useMemo(() => highlightCode(value, language), [value, language]);
  const validErrorLine = useMemo(() => {
    if (typeof errorLine !== "number") return null;
    const clamped = Math.min(Math.max(1, errorLine), lineCount);
    return Number.isFinite(clamped) ? clamped : null;
  }, [errorLine, lineCount]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd, value: current } = el;
    const next = `${current.slice(0, selectionStart)}  ${current.slice(selectionEnd)}`;
    onChange?.(next);
    requestAnimationFrame(() => {
      el.selectionStart = selectionStart + 2;
      el.selectionEnd = selectionStart + 2;
    });
  };

  const renderGutterLine = (lineNumber: number) => {
    const isError = validErrorLine === lineNumber;
    return (
      <div
        key={lineNumber}
        className={cn(
          "flex h-6 items-center justify-end gap-1",
          isError && "rounded-md bg-error-100 font-bold text-error-600",
        )}
      >
        <span className={cn(isError && "px-1")}>{lineNumber}</span>
        {isError && (
          <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-error-500" />
        )}
      </div>
    );
  };

  return (
    <div
      className={cn(
        "group/code relative overflow-hidden rounded-md border border-border-default bg-surface-muted/40 font-mono text-xs leading-6 shadow-sm transition-colors",
        "focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-200",
        disabled && "cursor-not-allowed opacity-60",
        className,
      )}
    >
      {/* Scroll container syncs the gutter and the highlighted/typed layers. */}
      <div className="flex max-h-[28rem] min-h-full overflow-auto">
        {/* Line-number gutter */}
        <pre
          aria-hidden
          className="sticky left-0 z-10 shrink-0 select-none border-r border-border-default bg-surface-muted/80 px-2 py-3 text-right text-text-tertiary"
        >
          {Array.from({ length: lineCount }, (_, index) => renderGutterLine(index + 1))}
        </pre>

        {/* Highlighted overlay + transparent textarea share the same padding. */}
        <div className="relative min-w-0 flex-1">
          {/* Error-line strip mirrors the textarea's h-6 rows so the highlight
              aligns to the code line without any computed pixel offsets. */}
          {validErrorLine !== null && (
            <div aria-hidden className="pointer-events-none absolute inset-0 flex flex-col px-3 py-3">
              {Array.from({ length: lineCount }, (_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-6 border-b-2 border-transparent",
                    index + 1 === validErrorLine && "border-b-error-500 bg-error-100/30",
                  )}
                />
              ))}
            </div>
          )}
          <pre
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden px-3 py-3 text-text-primary"
            dangerouslySetInnerHTML={{
              __html: value ? highlighted : placeholder ? `&nbsp;${escapeHtml(placeholder)}` : "&nbsp;",
            }}
          />
          <textarea
            ref={textareaRef}
            id={id}
            aria-label={ariaLabel}
            value={value}
            onChange={(event) => onChange?.(event.target.value)}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            disabled={disabled}
            spellCheck={false}
            placeholder={placeholder}
            rows={lineCount}
            className={cn(
              "relative block w-full resize-none bg-transparent px-3 py-3 text-transparent caret-text-primary outline-none",
              "placeholder:text-transparent selection:bg-primary-200 selection:text-primary-900",
              readOnly && "cursor-default",
              disabled && "cursor-not-allowed",
            )}
          />
        </div>
      </div>
    </div>
  );
}

export default CodeEditor;
