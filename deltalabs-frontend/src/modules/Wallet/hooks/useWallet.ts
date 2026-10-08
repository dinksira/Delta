/**
 * useWallet
 * TanStack Query hooks for the Wallet module — server state lives here
 * (the repo-wide split: API data → React Query), local dialog state stays
 * in the view. Mutations invalidate the module's query keys so the balance,
 * methods, and activity feed refresh together.
 *
 * @example
 * ```ts
 * const { data: balance } = useWalletBalance();
 * const topUp = useTopUp();
 * topUp.mutate({ methodId, amount });
 * ```
 */

/** ################################ IMPORT ############################# */
/** React Query primitives, API boundary, key factory, module types. */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { walletApi } from "@/modules/Wallet/api/walletApi";
import { walletQueryKeys } from "@/modules/Wallet/hooks/walletQueryKeys";
import type {
  AddPaymentMethodInput,
  SendInput,
  TopUpInput,
  WithdrawInput,
} from "@/modules/Wallet/types/walletTypes";
/** ################################ /IMPORT ############################# */

/** ################################ HOOKS ############################# */
/** Query hooks. */

/** Wallet balance snapshot. */
export function useWalletBalance() {
  return useQuery({
    queryKey: walletQueryKeys.balance(),
    queryFn: walletApi.fetchBalance,
    staleTime: 30_000,
  });
}

/** Stored payment methods. */
export function usePaymentMethods() {
  return useQuery({
    queryKey: walletQueryKeys.methods(),
    queryFn: walletApi.fetchMethods,
    staleTime: 30_000,
  });
}

/** Activity feed, newest first. */
export function useWalletTransactions() {
  return useQuery({
    queryKey: walletQueryKeys.transactions(),
    queryFn: walletApi.fetchTransactions,
    staleTime: 15_000,
  });
}
/** ################################ /HOOKS ############################# */

/** ################################ HOOKS ############################# */
/** Mutation hooks — each invalidates the whole wallet slice on success. */

function useInvalidateWallet() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: walletQueryKeys.all });
}

/** Credits the wallet through a verified method. */
export function useTopUp() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (input: TopUpInput) => walletApi.topUp(input),
    onSuccess: invalidate,
  });
}

/** Debits the wallet to a verified method (settles as pending). */
export function useWithdraw() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (input: WithdrawInput) => walletApi.withdraw(input),
    onSuccess: invalidate,
  });
}

/** Debits the wallet to a recipient phone number. */
export function useSendMoney() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (input: SendInput) => walletApi.sendMoney(input),
    onSuccess: invalidate,
  });
}

/** Links a new payment method. */
export function useAddPaymentMethod() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (input: AddPaymentMethodInput) => walletApi.addMethod(input),
    onSuccess: invalidate,
  });
}

/** Removes a payment method. */
export function useRemovePaymentMethod() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (methodId: string) => walletApi.removeMethod(methodId),
    onSuccess: invalidate,
  });
}

/** Promotes a payment method to default. */
export function useSetDefaultPaymentMethod() {
  const invalidate = useInvalidateWallet();
  return useMutation({
    mutationFn: (methodId: string) => walletApi.setDefaultMethod(methodId),
    onSuccess: invalidate,
  });
}
/** ################################ /HOOKS ############################# */
