/**
 * Minimal sanitizer for author-authored rich text (question stems).
 *
 * Keeps harmless formatting tags (`b`, `i`, `u`, `mark`, `span[data-blank]`)
 * while stripping script/style/iframe content and all event handlers or
 * `javascript:` links, so stored HTML can be rendered with
 * `dangerouslySetInnerHTML` for participants.
 */

const FORBIDDEN_TAGS = new Set([
  "script",
  "style",
  "iframe",
  "object",
  "embed",
  "form",
  "input",
  "button",
  "select",
  "textarea",
  "link",
  "meta",
  "base",
  "template",
]);

function isDangerousHref(attr: Attr): boolean {
  return (
    attr.name.toLowerCase() === "href" && attr.value.trim().toLowerCase().startsWith("javascript:")
  );
}

function sanitizeNode(root: ParentNode): void {
  for (const child of Array.from(root.children)) {
    const element = child as HTMLElement;
    if (FORBIDDEN_TAGS.has(element.tagName.toLowerCase())) {
      element.remove();
      continue;
    }
    for (const attr of Array.from(element.attributes)) {
      if (attr.name.toLowerCase().startsWith("on") || isDangerousHref(attr)) {
        element.removeAttribute(attr.name);
      }
    }
    sanitizeNode(element);
  }
}

/** Strip dangerous tags/attributes from an HTML string. */
export function sanitizeRichText(html: string): string {
  if (!html || typeof document === "undefined") {
    return "";
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  sanitizeNode(template.content);
  return template.innerHTML;
}

/** Replace authored blank markers with a stable `____` placeholder glyph. */
export const BLANK_GLYPH = "____";

export const BLANK_SPAN_TAG = `<span data-blank="1">${BLANK_GLYPH}</span>`;

/** Count authored blank markers (`[data-blank]`) inside a question stem. */
export function countBlanks(html: string): number {
  if (!html || typeof document === "undefined") {
    return 0;
  }
  const template = document.createElement("template");
  template.innerHTML = html;
  return template.content.querySelectorAll("[data-blank]").length;
}
