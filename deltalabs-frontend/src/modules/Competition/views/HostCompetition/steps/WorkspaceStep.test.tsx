/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  HostCompetitionWizardProvider,
  QUESTION_CODE_SEED,
} from "@/modules/Competition/context/HostCompetitionWizardContext";

import { WorkspaceStep } from "./WorkspaceStep";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
function renderWorkspace() {
  return render(
    <HostCompetitionWizardProvider>
      <WorkspaceStep />
    </HostCompetitionWizardProvider>,
  );
}
/** ################################ /HELPERS ############################# */

describe("WorkspaceStep", () => {
  it("shows the empty prompt until a module is selected", () => {
    renderWorkspace();

    expect(screen.getByText("Select a module to get started...")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Modules" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Module settings" })).toBeInTheDocument();
  });

  it("opens the code canvas with Q1 seeded and adds new question tabs", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Code Editor" }));
    expect(screen.getByRole("tab", { name: "Q1." })).toBeInTheDocument();

    const editor = screen.getByLabelText("Code description editor");
    expect(editor).toHaveValue(QUESTION_CODE_SEED);

    await user.click(screen.getByRole("button", { name: "Add question" }));
    expect(screen.getByRole("tab", { name: "Q2." })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Q2." })).toHaveAttribute("aria-selected", "true");
  });

  it("marks the active module and falls back to a placeholder for unbuilt canvases", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const codeButton = screen.getByRole("button", { name: "Code Editor" });
    expect(codeButton).toHaveAttribute("aria-pressed", "false");

    await user.click(codeButton);
    expect(codeButton).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Markdown Pad" }));
    expect(screen.getByText(/Markdown Pad canvas is not available yet/)).toBeInTheDocument();
  });
});
