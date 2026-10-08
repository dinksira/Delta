/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HostCompetitionWizardProvider } from "@/modules/Competition/context/HostCompetitionWizardContext";

import { PrizesStep } from "./PrizesStep";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
function renderPrizes() {
  return render(
    <HostCompetitionWizardProvider>
      <PrizesStep />
    </HostCompetitionWizardProvider>,
  );
}
/** ################################ /HELPERS ############################# */

describe("PrizesStep", () => {
  it("starts with one empty prize card and edits its rank", async () => {
    const user = userEvent.setup();
    renderPrizes();

    const rank = screen.getByPlaceholderText("eg. 1st place");
    await user.type(rank, "1st place");
    expect(rank).toHaveValue("1st place");
    expect(screen.getByDisplayValue("Money")).toBeInTheDocument();
  });

  it("appends prize cards with Add and removes them by index", async () => {
    const user = userEvent.setup();
    renderPrizes();

    await user.click(screen.getByRole("button", { name: /add/i }));
    expect(screen.getAllByPlaceholderText("eg. 1st place")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Remove prize 2" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove prize 2" }));
    expect(screen.getAllByPlaceholderText("eg. 1st place")).toHaveLength(1);
  });
});
