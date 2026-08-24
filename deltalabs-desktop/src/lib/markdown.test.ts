import { describe, expect, it } from "vitest";

import { renderMarkdown } from "@/lib/markdown";

describe("renderMarkdown", () => {
  it("returns an empty string for empty source", () => {
    expect(renderMarkdown("")).toBe("");
    expect(renderMarkdown(undefined as unknown as string)).toBe("");
  });

  it("renders ATX headings", () => {
    expect(renderMarkdown("# Title")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("## Sub")).toBe("<h2>Sub</h2>");
    expect(renderMarkdown("###### Tiny")).toBe("<h6>Tiny</h6>");
  });

  it("renders setext headings", () => {
    expect(renderMarkdown("Title\n====")).toBe("<h1>Title</h1>");
    expect(renderMarkdown("Subtitle\n----")).toBe("<h2>Subtitle</h2>");
  });

  it("renders paragraphs by joining wrapped lines", () => {
    expect(renderMarkdown("Hello world")).toBe("<p>Hello world</p>");
    expect(renderMarkdown("line one\nline two")).toBe("<p>line one line two</p>");
  });

  it("renders fenced code blocks with escaped content", () => {
    expect(renderMarkdown("```py\nprint('<x>')\n```")).toBe(
      "<pre><code>print('&lt;x&gt;')</code></pre>",
    );
  });

  it("renders blockquotes", () => {
    expect(renderMarkdown("> be careful")).toBe("<blockquote><p>be careful</p></blockquote>");
  });

  it("renders unordered and ordered lists", () => {
    expect(renderMarkdown("- a\n- b")).toBe("<ul><li>a</li><li>b</li></ul>");
    expect(renderMarkdown("1. a\n2. b")).toBe("<ol><li>a</li><li>b</li></ol>");
  });

  it("renders horizontal rules", () => {
    expect(renderMarkdown("---")).toBe("<hr />");
    expect(renderMarkdown("***")).toBe("<hr />");
  });

  it("renders tables", () => {
    const table = "| A | B |\n| --- | --- |\n| 1 | 2 |";
    expect(renderMarkdown(table)).toBe(
      "<table><thead><tr><th>A</th><th>B</th></tr></thead><tbody><tr><td>1</td><td>2</td></tr></tbody></table>",
    );
  });

  it("renders inline code without applying other inline formatting", () => {
    expect(renderMarkdown("Use `a < b` for that")).toBe("<p>Use <code>a &lt; b</code> for that</p>");
  });

  it("renders bold, italic, strikethrough, links and images", () => {
    expect(renderMarkdown("**bold** text")).toBe("<p><strong>bold</strong> text</p>");
    expect(renderMarkdown("*em* and _em2_")).toBe("<p><em>em</em> and <em>em2</em></p>");
    expect(renderMarkdown("~~gone~~")).toBe("<p><del>gone</del></p>");
    expect(renderMarkdown("[docs](https://x.dev)")).toBe(
      '<p><a href="https://x.dev">docs</a></p>',
    );
    expect(renderMarkdown("![alt](https://x.dev/i.png)")).toBe(
      '<p><img src="https://x.dev/i.png" alt="alt" /></p>',
    );
  });

  it("escapes raw html so it cannot inject markup", () => {
    expect(renderMarkdown("<script>alert(1)</script>")).toBe(
      "<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>",
    );
  });
});