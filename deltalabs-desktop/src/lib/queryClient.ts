/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { QueryClient } from "@tanstack/react-query";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/**
 * Factory for a per-browser QueryClient instance.
 * Instantiate inside a Client Component (e.g. `useState`) so server renders do not share cache.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 0,
      },
    },
  });
}

let browserQueryClient: QueryClient | null = null;

/** Returns one browser-scoped QueryClient instance for the app lifetime. */
export function getBrowserQueryClient(): QueryClient {
  if (browserQueryClient) return browserQueryClient;
  browserQueryClient = createQueryClient();
  return browserQueryClient;
}

/** Clears cached queries when auth session ends. */
export function clearBrowserQueryCache(): void {
  browserQueryClient?.clear();
}
/** ################################ /COMPONENT ############################# */
