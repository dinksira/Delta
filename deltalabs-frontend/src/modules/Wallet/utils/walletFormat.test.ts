/**
 * walletFormat.test
 * Unit tests for the Wallet module's pure formatting helpers.
 */

/** ################################ IMPORT ############################# */
/** Vitest assertions and the helpers under test. */
import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatETB,
  formatSignedETB,
  isRecipientPhone,
  maskAccount,
  parseAmountInput,
} from "./walletFormat";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
describe("formatETB", () => {
  it("formats whole numbers with two decimals", () => {
    expect(formatETB(12450)).toBe("12,450.00");
  });

  it("inserts thousands separators", () => {
    expect(formatETB(12450.5)).toBe("12,450.50");
  });

  it("uses the absolute value", () => {
    expect(formatETB(-320)).toBe("320.00");
  });
});

describe("formatSignedETB", () => {
  it("prefixes credits with a plus", () => {
    expect(formatSignedETB(1500)).toBe("+1,500.00");
  });

  it("prefixes debits with a minus", () => {
    expect(formatSignedETB(-320)).toBe("-320.00");
  });

  it("renders zero without a sign", () => {
    expect(formatSignedETB(0)).toBe("0.00");
  });
});

describe("formatCurrency", () => {
  it("prepends the currency code", () => {
    expect(formatCurrency(500)).toBe("ETB 500.00");
  });
});

describe("parseAmountInput", () => {
  it("accepts a plain integer", () => {
    expect(parseAmountInput("500")).toBe(500);
  });

  it("accepts comma-separated decimals", () => {
    expect(parseAmountInput("1,250.50")).toBe(1250.5);
  });

  it("rejects zero and negatives", () => {
    expect(parseAmountInput("0")).toBeNull();
    expect(parseAmountInput("-5")).toBeNull();
  });

  it("rejects non-numeric input", () => {
    expect(parseAmountInput("abc")).toBeNull();
    expect(parseAmountInput("12.345")).toBeNull();
    expect(parseAmountInput("")).toBeNull();
  });
});

describe("maskAccount", () => {
  it("keeps head and tail of a long account", () => {
    expect(maskAccount("+251912345678")).toBe("+251 •• •• 78");
  });

  it("masks short values entirely", () => {
    expect(maskAccount("1234")).toBe("••••");
  });
});

describe("isRecipientPhone", () => {
  it("accepts a plausible MSISDN", () => {
    expect(isRecipientPhone("+251912345678")).toBe(true);
  });

  it("rejects too-short input", () => {
    expect(isRecipientPhone("12345")).toBe(false);
  });
});
/** ################################ /HELPERS ############################# */
