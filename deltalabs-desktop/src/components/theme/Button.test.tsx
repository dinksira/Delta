/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/theme/Button";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
describe("Button", () => {
  it("renders accessible label", () => {
    render(<Button type="button">Submit</Button>);
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();
  });
});
/** ################################ /COMPONENT ############################# */
