/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";

import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
describe("cx", () => {
  it("joins truthy class names", () => {
    expect(cx("a", false, "b", null, undefined, "c")).toBe("a b c");
  });

  it("resolves conflicting Tailwind utilities in favour of the last one", () => {
    expect(cx("text-text-secondary", "text-primary-600")).toBe("text-primary-600");
  });

  it("lets a caller override a component default", () => {
    // This is the behaviour `getButtonClassName` relies on for `className`.
    expect(cx("rounded-md", "rounded-full")).toBe("rounded-full");
  });

  it("keeps utilities that do not conflict", () => {
    expect(cx("inline-flex", "text-primary-600", "gap-2")).toBe(
      "inline-flex text-primary-600 gap-2",
    );
  });

  it("preserves arbitrary values and opacity modifiers", () => {
    expect(cx("text-primary-600/60", "text-text-inverse")).toBe("text-text-inverse");
    expect(cx("w-[2px]")).toBe("w-[2px]");
  });
});
/** ################################ /COMPONENT ############################# */
