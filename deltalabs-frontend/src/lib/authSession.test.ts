import { describe, expect, it } from "vitest";

import { isAuthenticatedFromCookieValue } from "@/lib/authSession";

describe("isAuthenticatedFromCookieValue", () => {
  it("returns false for undefined and empty values", () => {
    expect(isAuthenticatedFromCookieValue(undefined)).toBe(false);
    expect(isAuthenticatedFromCookieValue("")).toBe(false);
    expect(isAuthenticatedFromCookieValue("   ")).toBe(false);
  });

  it("returns true for non-empty cookie value", () => {
    expect(isAuthenticatedFromCookieValue("session-token")).toBe(true);
  });
});
