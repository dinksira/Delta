/**
 * Minimal, dependency-free CommonMark subset renderer used by the Markdown Pad
 * workspace module and the Markdown atom. Produces safe, token-free HTML that is
 * expected to be passed through `sanitizeRichText` before `dangerouslySetInnerHTML`.
 *
 * Supports: ATX headings (#..######), setext headings (=== / ---), paragraphs,
 * fenced code blocks, blockquotes, unordered/ordered lists, tables, horizontal
 * rules, inline code, bold/italic/strikethrough, links, images, and escaped
 * characters. Anything outside this subset is intentionally not rendered.
 */

// ============================================================================
// HELPERS
// ============================================================================

/** Escape raw text so it can never introduce markup outside the renderer. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Inline renderer: code spans are protected, then formatting is applied. */
function renderInline(text: string): string {
  const codeSpans: string[] = [];
  const protectedText = text.replace(/`([^`]+)`/g, (_match, code: string) => {
    codeSpans.push(escapeHtml(code));
    return `\u0000CODE${codeSpans.length - 1}\u0000`;
  });
  const escaped = escapeHtml(protectedText);

  const formatted = escaped
    .replace(/(^|[^\\])\*\*([^*]+)\*\*/g, "$1<strong>$2</strong>")
    .replace(/(^|[^*\\])\*([^*]+)\*/g, "$1<em>$2</em>")
    .replace(/(^|[^_\\])_([^_]+)_/g, "$1<em>$2</em>")
    .replace(/~~([^~]+)~~/g, "<del>$1</del>")
    .replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, alt, url, title) =>
      `<img src="${url}" alt="${alt ?? ""}"${title ? ` title="${title}"` : ""} />`,
    )
    .replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+["']([^"']*)["'])?\)/g, (_match, label, url, title) =>
      `<a href="${url}"${title ? ` title="${title}"` : ""}>${label}</a>`,
    );

  return formatted.replace(/\u0000CODE(\d+)\u0000/g, (_match, index) => {
    return `<code>${codeSpans[Number(index)]}</code>`;
  });
}

/** Escape the contents of a fenced code block for `<pre><code>`. */
function renderCodeBlock(code: string, _language: string): string {
  return `<pre><code>${escapeHtml(code)}</code></pre>`;
}

function renderTable(rows: string[][]): string {
  if (rows.length === 0) {
    return "";
  }
  const [header, ...body] = rows;
  const headCells = header.map((cell) => `<th>${cell}</th>`).join("");
  const bodyRows = body
    .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
    .join("");
  return `<table><thead><tr>${headCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

/** True when `line` is a table separator row (`|---|:---:|`). */
function isTableSeparator(line: string): boolean {
  const cells = line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|");
  return cells.length > 0 && cells.every((cell) => /^\s*:?-{3,}:?\s*$/.test(cell));
}

/** Split a table row into its cells, trimming surrounding pipes. */
function splitTableRow(line: string): string[] {
  return line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((cell) => renderInline(cell.trim()));
}

// ============================================================================
// RENDERER
// ============================================================================

/** Render a markdown source string to sanitizable HTML. */
export function renderMarkdown(source: string): string {
  if (!source) {
    return "";
  }
  const lines = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const blocks: string[] = [];
  let index = 0;

  const push = (html: string) => {
    if (html) {
      blocks.push(html);
    }
  };

  const consumeParagraph = (start: number): number => {
    const paragraph: string[] = [];
    let cursor = start;
    while (cursor < lines.length) {
      const line = lines[cursor];
      // Setext heading: `text` then `===` (h1) or `---` (h2).
      if (paragraph.length === 1 && /^\s*(={3,})\s*$/.test(line)) {
        push(`<h1>${renderInline(paragraph[0].trim())}</h1>`);
        return cursor + 1;
      }
      if (paragraph.length === 1 && /^\s*(-{3,})\s*$/.test(line)) {
        push(`<h2>${renderInline(paragraph[0].trim())}</h2>`);
        return cursor + 1;
      }
      if (!line.trim()) {
        break;
      }
      paragraph.push(line);
      cursor += 1;
    }
    push(`<p>${paragraph.map((l) => renderInline(l.trim())).join(" ")}</p>`);
    return cursor;
  };

  while (index < lines.length) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      index += 1;
      continue;
    }

    // Fenced code block.
    if (/^\s*(```+|~~~+)/.test(line)) {
      const fence = line.replace(/^\s*/, "").match(/^(```+|~~~+)/)?.[1] ?? "```";
      const language = line.slice(fence.length).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length) {
        const inner = lines[index];
        if (inner.trim().startsWith(fence.charAt(0)) && inner.trim().slice(0, fence.length) === fence) {
          break;
        }
        code.push(inner);
        index += 1;
      }
      push(renderCodeBlock(code.join("\n"), language));
      index += 1;
      continue;
    }

    // ATX heading.
    const heading = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      const level = heading[1].length;
      push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      index += 1;
      continue;
    }

    // Horizontal rule.
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(trimmed)) {
      push("<hr />");
      index += 1;
      continue;
    }

    // Table: current line + a separator line must follow.
    if (line.trim().startsWith("|") && index + 1 < lines.length && isTableSeparator(lines[index + 1])) {
      const rows: string[][] = [splitTableRow(line)];
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]));
        index += 1;
      }
      push(renderTable(rows));
      continue;
    }

    // Blockquote.
    if (trimmed.startsWith(">")) {
      const quote: string[] = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        quote.push(lines[index].replace(/^\s*>\s?/, ""));
        index += 1;
      }
      push(`<blockquote><p>${quote.map((l) => renderInline(l.trim())).join(" ")}</p></blockquote>`);
      continue;
    }

    // Unordered list.
    if (/^\s*[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*[-*+]\s+(.*)$/);
        if (!item) {
          break;
        }
        items.push(renderInline(item[1].trim()));
        index += 1;
      }
      push(`<ul>${items.map((item) => `<li>${item}</li>`).join("")}</ul>`);
      continue;
    }

    // Ordered list.
    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length) {
        const item = lines[index].match(/^\s*\d+\.\s+(.*)$/);
        if (!item) {
          break;
        }
        items.push(renderInline(item[1].trim()));
        index += 1;
      }
      push(`<ol>${items.map((item) => `<li>${item}</li>`).join("")}</ol>`);
      continue;
    }

    // Paragraph (including setext headings captured in consumeParagraph).
    index = consumeParagraph(index);
  }

  return blocks.join("\n");
}