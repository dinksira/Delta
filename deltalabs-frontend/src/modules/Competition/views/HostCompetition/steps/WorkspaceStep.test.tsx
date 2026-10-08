/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HostCompetitionWizardProvider } from "@/modules/Competition/context/HostCompetitionWizardContext";

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
    expect(screen.getByRole("navigation", { name: "Workspace modules" })).toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: "Module settings" })).toBeInTheDocument();
  });

  it("opens the Code Editor canvas with the shared question-builder chrome", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    const codeButton = screen.getByRole("button", { name: "Code Editor" });
    expect(codeButton).toHaveAttribute("aria-pressed", "false");
    await user.click(codeButton);
    expect(codeButton).toHaveAttribute("aria-pressed", "true");

    expect(screen.getByRole("tab", { name: "Test cases (2)" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coding" })).toBeInTheDocument();
    expect(screen.getByLabelText("Difficulty Level")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add question" }));
    await user.type(
      screen.getByPlaceholderText("e.g. Two Sum — LeetCode-style challenge"),
      "Binary Search",
    );
    expect(screen.getByRole("button", { name: "Binary Search" })).toBeInTheDocument();
  });

  it("routes Question Builder to the authoring editor once the type is a quiz kind", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Question Builder" }));
    expect(screen.getByText("Coding question detected")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Coding" }));
    await user.click(screen.getByRole("button", { name: "Multiple Choice" }));

    expect(screen.getByRole("heading", { name: "Question Editor" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add option" })).toBeInTheDocument();
  });

  it("converts the question when Markdown Pad or Design Canvas is selected", async () => {
    const user = userEvent.setup();
    renderWorkspace();

    await user.click(screen.getByRole("button", { name: "Markdown Pad" }));
    expect(screen.getByRole("heading", { name: "Markdown Question" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Design Canvas" }));
    expect(screen.getByRole("heading", { name: "Design Challenge" })).toBeInTheDocument();
  });
});
