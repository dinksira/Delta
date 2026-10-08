/**
 * Wallet module — public API.
 * Barrel re-exporting the page view, hooks, types, and feature dialogs.
 *
 * @example
 * ```tsx
 * import { WalletPageView } from "@/modules/Wallet";
 * ```
 */

/** ################################ EXPORTS ############################# */
/** Module surface. */
export { WalletPageView } from "./views/WalletPageView";
export {
  useAddPaymentMethod,
  usePaymentMethods,
  useRemovePaymentMethod,
  useSendMoney,
  useSetDefaultPaymentMethod,
  useTopUp,
  useWalletBalance,
  useWalletTransactions,
  useWithdraw,
} from "./hooks/useWallet";
export { walletQueryKeys } from "./hooks/walletQueryKeys";
export { walletApi, WalletApiError, MIN_AMOUNT_ETB } from "./api/walletApi";
export { formatETB } from "./utils/walletFormat";
export { AddPaymentMethodDialog } from "./features/AddPaymentMethodDialog";
export { WalletActionDialog } from "./features/WalletActionDialog";
export type {
  AddPaymentMethodInput,
  CurrencyCode,
  PaymentMethod,
  PaymentMethodKind,
  PaymentMethodStatus,
  SendInput,
  TopUpInput,
  TransactionDirection,
  TransactionKind,
  TransactionStatus,
  WalletAction,
  WalletBalance,
  WalletTransaction,
  WithdrawInput,
} from "./types/walletTypes";
/** ################################ /EXPORTS ############################# */
