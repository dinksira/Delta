/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import { highlightCode } from "@/components/molecules/CodeEditor/CodeEditor";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Prism-based highlighting resolves language aliases and stays safe. */
describe("highlightCode", () => {
  it("wraps tokens for a known language", () => {
    const html = highlightCode("const x = 1;", "JavaScript");
    expect(html).toContain("<span");
  });

  it("falls back to the clike grammar and still escapes markup for unknown languages", () => {
    const html = highlightCode("<script>alert(1)</script>", "Klingon");
    expect(html).toContain("&lt;");
    expect(html).not.toContain("<script>");
  });

  it("escapes dangerous markup even for known languages", () => {
    const html = highlightCode("<b>hi</b>", "JavaScript");
    expect(html).not.toContain("<b>hi</b>");
  });

  it("highlights markup for HTML", () => {
    const html = highlightCode("<p>Hello</p>", "HTML");
    expect(html).toContain("Hello");
  });
});
/** ################################ /COMPONENT ############################# */
