/**
 * walletQueryKeys
 * Namespaced React Query keys for the Wallet module, extending the shared
 * `["dl", ...]` root from `@/lib/queryKeys`.
 *
 * @example
 * ```ts
 * queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
 * ```
 */

/** ################################ IMPORT ############################# */
/** Shared query-key root. */
import { queryKeys } from "@/lib/queryKeys";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
/** Key factory for the module's queries. */
export const walletQueryKeys = {
  all: [...queryKeys.root, "wallet"] as const,
  balance: () => [...walletQueryKeys.all, "balance"] as const,
  methods: () => [...walletQueryKeys.all, "methods"] as const,
  transactions: () => [...walletQueryKeys.all, "transactions"] as const,
} as const;
/** ################################ /CONSTANTS ############################# */
