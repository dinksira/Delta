/**
 * Runtime configuration derived from public environment variables.
 * Server and client bundles both read `NEXT_PUBLIC_*` values inlined at build time.
 */

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Base URL for the backend API (no trailing slash). Empty string means same-origin relative paths. */
export function getPublicApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  return trimTrailingSlash(raw);
}

export const publicConfig = {
  apiBaseUrl: getPublicApiBaseUrl(),
} as const;
