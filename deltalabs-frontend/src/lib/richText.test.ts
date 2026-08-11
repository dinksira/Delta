import { describe, expect, it } from "vitest";

import { BLANK_SPAN_TAG, countBlanks, sanitizeRichText } from "@/lib/richText";

describe("sanitizeRichText", () => {
  it("returns an empty string for empty input", () => {
    expect(sanitizeRichText("")).toBe("");
    expect(sanitizeRichText(undefined as unknown as string)).toBe("");
  });

  it("keeps harmless formatting tags", () => {
    const html = "<b>bold</b> <i>italic</i> <u>under</u> <mark>highlight</mark>";
    expect(sanitizeRichText(html)).toBe(html);
  });

  it("keeps authored blank markers", () => {
    expect(sanitizeRichText(BLANK_SPAN_TAG)).toBe(BLANK_SPAN_TAG);
  });

  it("strips script/style/iframe tags entirely", () => {
    const html = "hi<script>alert('x')</script><style>body{}</style><iframe src=x></iframe>done";
    expect(sanitizeRichText(html)).toBe("hidone");
  });

  it("strips event handler attributes", () => {
    const html = '<span onclick="alert(1)" data-blank="1">____</span>';
    expect(sanitizeRichText(html)).toBe('<span data-blank="1">____</span>');
  });

  it("strips javascript: hrefs", () => {
    const html = '<a href="javascript:alert(1)">click</a>';
    expect(sanitizeRichText(html)).toBe("<a>click</a>");
  });

  it("recursively sanitizes nested elements", () => {
    const html = '<p><b onclick="x()">text</b><script>bad</script></p>';
    expect(sanitizeRichText(html)).toBe("<p><b>text</b></p>");
  });
});

describe("countBlanks", () => {
  it("returns 0 for empty text", () => {
    expect(countBlanks("")).toBe(0);
  });

  it("counts each authored blank marker in the stem", () => {
    const html = `The <b>quick</b> ${BLANK_SPAN_TAG} fox ${BLANK_SPAN_TAG} over the ${BLANK_SPAN_TAG}.`;
    expect(countBlanks(html)).toBe(3);
  });
});
