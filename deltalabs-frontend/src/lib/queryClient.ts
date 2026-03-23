import { QueryClient } from "@tanstack/react-query";

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
