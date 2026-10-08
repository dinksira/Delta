/**
 * mockWalletStore
 * localStorage-backed mock wallet state (balance, payment methods,
 * transactions). Mirrors the `mockAuthStore` pattern: a swap-in data layer
 * behind `walletApi`, replaceable by real `/v1` endpoints later.
 *
 * MOCK ONLY — production money state must never live in localStorage.
 */

/** ################################ IMPORT ############################# */
/** Provider catalogue + module types. */
import { PAYMENT_PROVIDERS } from "@/modules/Wallet/data/paymentProviders";
import type {
  PaymentMethod,
  WalletBalance,
  WalletTransaction,
} from "@/modules/Wallet/types/walletTypes";
/** ################################ /IMPORT ############################# */

/** ################################ CONSTANTS ############################# */
/** Storage keys and the seeded demo state. */

/** localStorage key for the mock wallet snapshot. */
const WALLET_KEY = "dl.wallet.v1";

/** Persisted wallet snapshot. */
export type WalletSnapshot = Readonly<{
  balance: WalletBalance;
  methods: PaymentMethod[];
  transactions: WalletTransaction[];
}>;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readSnapshot(): WalletSnapshot | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(WALLET_KEY);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw) as WalletSnapshot;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot: WalletSnapshot): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(WALLET_KEY, JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}

/** Monotonic-enough id for mock records (collisions are practically impossible). */
export function nextId(prefix: string): string {
  const unique = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random()}`;
  return `${prefix}_${unique}`;
}

function hoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function seedSnapshot(): WalletSnapshot {
  const [telebirr, mpesa, cbe] = PAYMENT_PROVIDERS;
  return {
    balance: {
      available: 12450.5,
      pendingIn: 250,
      currency: "ETB",
      walletId: "DL-4821",
    },
    methods: [
      {
        id: "pm_seed_telebirr",
        kind: telebirr.kind,
        label: telebirr.label,
        accountLabel: "+2519 •• •• 12",
        status: "verified",
        isDefault: true,
      },
      {
        id: "pm_seed_cbe",
        kind: cbe.kind,
        label: cbe.label,
        accountLabel: "•••• •••• 4821",
        status: "verified",
        isDefault: false,
      },
      {
        id: "pm_seed_mpesa",
        kind: mpesa.kind,
        label: mpesa.label,
        accountLabel: "+2517 •• •• 08",
        status: "pending",
        isDefault: false,
      },
    ],
    transactions: [
      {
        id: "tx_seed_1",
        direction: "in",
        kind: "topup",
        title: "Top up",
        subtitle: "Telebirr",
        amount: 1500,
        status: "completed",
        createdAt: hoursAgo(2),
      },
      {
        id: "tx_seed_2",
        direction: "in",
        kind: "prize",
        title: "Battle prize",
        subtitle: "Topic Battle · Algebra Sprint",
        amount: 250,
        status: "completed",
        createdAt: hoursAgo(26),
      },
      {
        id: "tx_seed_3",
        direction: "out",
        kind: "purchase",
        title: "Course enrollment",
        subtitle: "Awash Bank",
        amount: -320,
        status: "completed",
        createdAt: hoursAgo(50),
      },
      {
        id: "tx_seed_4",
        direction: "out",
        kind: "withdraw",
        title: "Withdrawal",
        subtitle: "Commercial Bank of Ethiopia",
        amount: -1000,
        status: "pending",
        createdAt: hoursAgo(52),
      },
      {
        id: "tx_seed_5",
        direction: "out",
        kind: "transfer",
        title: "Sent money",
        subtitle: "To +2519 •• •• 34",
        amount: -75,
        status: "completed",
        createdAt: hoursAgo(74),
      },
    ],
  };
}

/** Loads the snapshot, seeding demo data on first use. */
export function loadWalletSnapshot(): WalletSnapshot {
  const existing = readSnapshot();
  if (existing) return existing;
  const seeded = seedSnapshot();
  writeSnapshot(seeded);
  return seeded;
}

/** Persists a snapshot after a mutation. */
export function saveWalletSnapshot(snapshot: WalletSnapshot): void {
  writeSnapshot(snapshot);
}
/** ################################ /CONSTANTS ############################# */
