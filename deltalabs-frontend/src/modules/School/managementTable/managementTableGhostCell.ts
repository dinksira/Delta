/** Ghost ops MT deep-link cells — `ghost:{ghostId}` or `ghost:{ghostId}:variant:{variantId}`. */

const GHOST_KEY_RE = /^ghost:([A-Za-z0-9_-]+)(?::variant:[A-Za-z0-9_-]+)?$/;

export function parseGhostDeepLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const m = value.trim().match(GHOST_KEY_RE);
  return m?.[1] ?? null;
}

/** Parent ghost row key `ghost:{id}` (not a nested `:variant:` key). */
export function isGhostParentDeepLink(value: unknown): boolean {
  if (typeof value !== "string") return false;
  return /^ghost:[A-Za-z0-9_-]+$/.test(value.trim());
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
