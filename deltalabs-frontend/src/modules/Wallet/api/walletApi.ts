/**
 * walletApi
 * Typed API boundary for the Wallet module. Every function is async and
 * throws `WalletApiError` with a human-readable message (the module's
 * `handleApiError` equivalent), so swapping the mock store for real
 * `/v1/wallet/*` endpoints touches only this file.
 *
 * @example
 * ```ts
 * const balance = await walletApi.fetchBalance();
 * await walletApi.topUp({ methodId: "pm_seed_telebirr", amount: 500 });
 * ```
 */

/** ################################ IMPORT ############################# */
/** Provider labels, mock store, module types, masking helper. */
import { providerLabel } from "@/modules/Wallet/data/paymentProviders";
import {
  loadWalletSnapshot,
  nextId,
  saveWalletSnapshot,
  type WalletSnapshot,
} from "@/modules/Wallet/api/mockWalletStore";
import type {
  AddPaymentMethodInput,
  PaymentMethod,
  SendInput,
  TopUpInput,
  WalletBalance,
  WalletTransaction,
  WithdrawInput,
} from "@/modules/Wallet/types/walletTypes";
import { maskAccount } from "@/modules/Wallet/utils/walletFormat";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
/** Limits and simulated network latency. */

/** Minimum amount accepted by any money flow, in ETB. */
export const MIN_AMOUNT_ETB = 10;

/** Simulated round-trip latency so loading states are exercised. */
const LATENCY_MS = 350;

/** Error thrown by every wallet API function. */
export class WalletApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WalletApiError";
  }
}
/** ################################ /CONSTANTS ############################# */

/** ################################ HELPERS ############################# */
/** Shared validation + mock plumbing. */

function delay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, LATENCY_MS));
}

function requirePositiveAmount(amount: number): void {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new WalletApiError("Enter a valid amount.");
  }
  if (amount < MIN_AMOUNT_ETB) {
    throw new WalletApiError(`Minimum amount is ETB ${MIN_AMOUNT_ETB}.`);
  }
}

function requireMethod(snapshot: WalletSnapshot, methodId: string): PaymentMethod {
  const method = snapshot.methods.find((m) => m.id === methodId);
  if (!method) throw new WalletApiError("Payment method not found.");
  if (method.status !== "verified") {
    throw new WalletApiError(`${method.label} is still pending verification.`);
  }
  return method;
}

function sortNewestFirst(transactions: WalletTransaction[]): WalletTransaction[] {
  return [...transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function appendTransaction(snapshot: WalletSnapshot, tx: WalletTransaction): WalletSnapshot {
  return { ...snapshot, transactions: [tx, ...snapshot.transactions] };
}
/** ################################ /HELPERS ############################# */

/** ################################ API ############################# */
/** Public API surface consumed by the module hooks. */

export const walletApi = {
  /** Current balance snapshot. */
  async fetchBalance(): Promise<WalletBalance> {
    await delay();
    return loadWalletSnapshot().balance;
  },

  /** Stored payment methods, default first. */
  async fetchMethods(): Promise<PaymentMethod[]> {
    await delay();
    const { methods } = loadWalletSnapshot();
    return [...methods].sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
  },

  /** Activity feed, newest first. */
  async fetchTransactions(): Promise<WalletTransaction[]> {
    await delay();
    return sortNewestFirst(loadWalletSnapshot().transactions);
  },

  /** Credits the wallet through a verified method. */
  async topUp({ methodId, amount }: TopUpInput): Promise<WalletTransaction> {
    await delay();
    requirePositiveAmount(amount);
    const snapshot = loadWalletSnapshot();
    const method = requireMethod(snapshot, methodId);

    const tx: WalletTransaction = {
      id: nextId("tx"),
      direction: "in",
      kind: "topup",
      title: "Top up",
      subtitle: method.label,
      amount,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    saveWalletSnapshot({
      ...snapshot,
      balance: { ...snapshot.balance, available: snapshot.balance.available + amount },
      transactions: [tx, ...snapshot.transactions],
    });
    return tx;
  },

  /** Debits the wallet to a verified method; settles as pending (24h). */
  async withdraw({ methodId, amount }: WithdrawInput): Promise<WalletTransaction> {
    await delay();
    requirePositiveAmount(amount);
    const snapshot = loadWalletSnapshot();
    const method = requireMethod(snapshot, methodId);
    if (amount > snapshot.balance.available) {
      throw new WalletApiError("Amount exceeds the available balance.");
    }

    const tx: WalletTransaction = {
      id: nextId("tx"),
      direction: "out",
      kind: "withdraw",
      title: "Withdrawal",
      subtitle: method.label,
      amount: -amount,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    saveWalletSnapshot({
      ...appendTransaction(snapshot, tx),
      balance: { ...snapshot.balance, available: snapshot.balance.available - amount },
    });
    return tx;
  },

  /** Debits the wallet to a recipient phone number; settles immediately. */
  async sendMoney({ recipient, amount }: SendInput): Promise<WalletTransaction> {
    await delay();
    requirePositiveAmount(amount);
    const snapshot = loadWalletSnapshot();
    if (amount > snapshot.balance.available) {
      throw new WalletApiError("Amount exceeds the available balance.");
    }

    const tx: WalletTransaction = {
      id: nextId("tx"),
      direction: "out",
      kind: "transfer",
      title: "Sent money",
      subtitle: `To ${maskAccount(recipient)}`,
      amount: -amount,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    saveWalletSnapshot({
      ...appendTransaction(snapshot, tx),
      balance: { ...snapshot.balance, available: snapshot.balance.available - amount },
    });
    return tx;
  },

  /** Stores a new verified method; only one default can exist at a time. */
  async addMethod({ kind, accountLabel }: AddPaymentMethodInput): Promise<PaymentMethod> {
    await delay();
    const account = accountLabel.trim();
    if (account.length < 6) {
      throw new WalletApiError("Enter a valid account or phone number.");
    }

    const snapshot = loadWalletSnapshot();
    const masked = maskAccount(account);
    if (snapshot.methods.some((m) => m.accountLabel === masked)) {
      throw new WalletApiError("This account is already linked to your wallet.");
    }

    const method: PaymentMethod = {
      id: nextId("pm"),
      kind,
      label: providerLabel(kind),
      accountLabel: masked,
      status: "verified",
      isDefault: snapshot.methods.length === 0,
    };
    saveWalletSnapshot({ ...snapshot, methods: [...snapshot.methods, method] });
    return method;
  },

  /** Removes a method, promoting the next verified one to default. */
  async removeMethod(methodId: string): Promise<void> {
    await delay();
    const snapshot = loadWalletSnapshot();
    const target = snapshot.methods.find((m) => m.id === methodId);
    if (!target) throw new WalletApiError("Payment method not found.");

    const remaining = snapshot.methods
      .filter((m) => m.id !== methodId)
      .map((m) => ({ ...m, isDefault: false }));
    if (target.isDefault && remaining.length > 0) {
      const nextDefault = remaining.find((m) => m.status === "verified") ?? remaining[0];
      nextDefault.isDefault = true;
    }
    saveWalletSnapshot({ ...snapshot, methods: remaining });
  },

  /** Promotes a method to default, demoting the previous one. */
  async setDefaultMethod(methodId: string): Promise<void> {
    await delay();
    const snapshot = loadWalletSnapshot();
    if (!snapshot.methods.some((m) => m.id === methodId)) {
      throw new WalletApiError("Payment method not found.");
    }
    saveWalletSnapshot({
      ...snapshot,
      methods: snapshot.methods.map((m) => ({ ...m, isDefault: m.id === methodId })),
    });
  },
} as const;

/** ################################ /API ############################# */
