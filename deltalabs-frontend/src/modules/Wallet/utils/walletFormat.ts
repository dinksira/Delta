/**
 * walletFormat
 * Pure formatting helpers for the Wallet module. Kept dependency-free and
 * unit-tested (`walletFormat.test.ts`) so presentation rules live in one place.
 *
 * @example
 * ```ts
 * formatETB(12450.5);        // "12,450.50"
 * formatSignedETB(-320);     // "-320.00"
 * formatCurrency(500);       // "ETB 500.00"
 * ```
 */

/** ################################ HELPERS ############################# */
/** Pure formatting functions. */

/** Two-decimal, thousands-separated number, always unsigned. */
export function formatETB(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
}

/** Signed money label: `"+1,500.00"` / `"-320.00"` / `"0.00"` for zero. */
export function formatSignedETB(amount: number): string {
  if (amount === 0) return formatETB(0);
  const sign = amount > 0 ? "+" : "-";
  return `${sign}${formatETB(amount)}`;
}

/** Full money label with the currency code, e.g. `"ETB 12,450.50"`. */
export function formatCurrency(amount: number): string {
  return `ETB ${formatETB(amount)}`;
}

/**
 * Parses user amount input into a positive number.
 * Accepts plain and comma-separated decimals; returns `null` when the input
 * is not a positive amount of money.
 */
export function parseAmountInput(raw: string): number | null {
  const normalized = raw.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const value = Number(normalized);
  if (!Number.isFinite(value) || value <= 0) return null;
  return value;
}

/** Mask a phone/account for display: keeps first 4 and last 2 characters. */
export function maskAccount(raw: string): string {
  const cleaned = raw.trim();
  if (cleaned.length <= 6) return "•".repeat(Math.max(cleaned.length, 2));
  const head = cleaned.slice(0, 4);
  const tail = cleaned.slice(-2);
  return `${head} •• •• ${tail}`;
}

/** True when `value` looks like a phone number we can send money to. */
export function isRecipientPhone(raw: string): boolean {
  const digits = raw.replace(/[^\d]/g, "");
  return digits.length >= 9;
}

/** ################################ /HELPERS ############################# */
