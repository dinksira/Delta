import { describe, expect, it } from "vitest";

import { cx } from "@/components/theme/utils";

describe("cx", () => {
  it("joins truthy class names", () => {
    expect(cx("a", false, "b", null, undefined, "c")).toBe("a b c");
  });
});
