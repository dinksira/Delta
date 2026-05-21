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
});
/** ################################ /COMPONENT ############################# */
