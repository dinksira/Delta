/**
 * useWalletBalance
 * Hook managing wallet balance with deduct and addFunds operations.
 */

import { useState, useCallback } from "react";

// ============================================================================
// HOOK
// ============================================================================

export function useWalletBalance(initialBalance: number = 200) {
  const [balance, setBalance] = useState(initialBalance);

  const deduct = useCallback((amount: number) => {
    setBalance((prev) => Math.max(0, prev - amount));
  }, []);

  const addFunds = useCallback((amount: number) => {
    setBalance((prev) => prev + amount);
  }, []);

  return { balance, deduct, addFunds };
}
