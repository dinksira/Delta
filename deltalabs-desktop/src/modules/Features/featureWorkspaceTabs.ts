/** Workspace browser-tab helpers — each open tab has a unique `ws` id and own route state. */

export const WORKSPACE_TAB_QUERY = "ws";

export function createWorkspaceTabId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `ws-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getWorkspaceTabId(
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
): string | null {
  const id = searchParams?.get(WORKSPACE_TAB_QUERY)?.trim();
  return id || null;
}

/** Attach or replace the workspace tab id on a path or absolute app href. */
export function withWorkspaceTabId(href: string, tabId: string): string {
  const cleanId = tabId.trim();
  if (!cleanId) return href;

  try {
    const base =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(href, base);
    url.searchParams.set(WORKSPACE_TAB_QUERY, cleanId);
    const path = `${url.pathname}${url.search}${url.hash}`;
    return href.startsWith("http") ? url.toString() : path;
  } catch {
    const sep = href.includes("?") ? "&" : "?";
    return `${href}${sep}${WORKSPACE_TAB_QUERY}=${encodeURIComponent(cleanId)}`;
  }
}

/** Keep an existing `ws` param when rewriting a URL (internal navigation). */
export function preserveWorkspaceTabId(nextHref: string, currentTabId: string | null): string {
  if (!currentTabId) return nextHref;
  return withWorkspaceTabId(nextHref, currentTabId);
}

export function deriveWorkspaceTabLabel(
  featureKey: string,
  displayLabel: string,
  existingTabs: readonly { featureKey: string }[],
): string {
  const base = displayLabel.trim() || featureKey;
  const key = featureKey.trim().toLowerCase();
  const sameCount = existingTabs.filter((t) => t.featureKey.trim().toLowerCase() === key).length;
  if (sameCount === 0) return base;
  return `${base} ${sameCount + 1}`;
}

/** Max workspace tabs in the strip (prevents runaway duplicates). */
export const MAX_WORKSPACE_TABS = 12;

export function routeBaseKey(href: string): string | null {
  try {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const url = new URL(href.trim(), origin);
    url.searchParams.delete(WORKSPACE_TAB_QUERY);
    return `${url.pathname}${url.search}`;
  } catch {
    return null;
  }
}
