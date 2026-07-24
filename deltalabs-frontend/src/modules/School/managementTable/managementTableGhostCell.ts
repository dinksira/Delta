/** Ghost ops MT deep-link cells — `ghost:{ghostId}` or `ghost:{ghostId}:variant:{variantId}`. */

const GHOST_KEY_RE = /^ghost:([A-Za-z0-9_-]+)(?::variant:[A-Za-z0-9_-]+)?$/;

export function parseGhostDeepLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(GHOST_KEY_RE);
  return m?.[1] ?? null;
}

export function isGhostDeepLink(value: unknown): boolean {
  return parseGhostDeepLink(value) !== null;
}

export function ghostDeepLinkKey(ghostId: string): string {
  return `ghost:${ghostId.trim()}`;
}

export function ghostVariantDeepLinkKey(ghostId: string, variantId: string): string {
  return `ghost:${ghostId.trim()}:variant:${variantId.trim()}`;
}
