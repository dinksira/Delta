/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { HostCompetitionWizardTemplate } from "./HostCompetitionWizardTemplate";
import type { HostCompetitionWizardTemplateProps } from "./HostCompetitionWizardTemplate.types";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
function renderTemplate(overrides?: Partial<HostCompetitionWizardTemplateProps>) {
  const onBack = vi.fn();
  const onPrevious = vi.fn();
  const onNext = vi.fn();
  const onDraft = vi.fn();
  const onPreview = vi.fn();

  render(
    <HostCompetitionWizardTemplate
      currentStep={2}
      totalSteps={3}
      stepLabel="Prize Details"
      onBack={onBack}
      onPrevious={onPrevious}
      onNext={onNext}
      onDraft={onDraft}
      onPreview={onPreview}
      {...overrides}
    >
      <p>step body</p>
    </HostCompetitionWizardTemplate>,
  );

  return { onBack, onPrevious, onNext, onDraft, onPreview };
}
/** ################################ /HELPERS ############################# */

describe("HostCompetitionWizardTemplate", () => {
  it("renders the header, step label, counter, and step body", () => {
    renderTemplate();

    expect(screen.getByRole("heading", { level: 1, name: "Host Competition" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Prize Details" })).toBeInTheDocument();
    expect(screen.getByText("Step 2 of 3")).toBeInTheDocument();
    expect(screen.getByText("step body")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Integrate" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Preview" })).toBeInTheDocument();
  });

  it("routes footer Back, Next, Draft, and Preview to their callbacks", async () => {
    const user = userEvent.setup();
    const { onPrevious, onNext, onDraft, onPreview } = renderTemplate();

    const footerButtons = screen.getAllByRole("button", { name: "Back" });
    await user.click(footerButtons[footerButtons.length - 1]);
    expect(onPrevious).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Draft" }));
    expect(onDraft).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Preview" }));
    expect(onPreview).toHaveBeenCalledTimes(1);
  });

  it("shows Launch as the primary action and a saved Draft state", () => {
    renderTemplate({ currentStep: 3, nextLabel: "Launch", draftSaved: true });

    expect(screen.getByRole("button", { name: "Launch" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saved" })).toBeInTheDocument();
  });

  it("surfaces a submit error above the footer", () => {
    renderTemplate({ submitError: "Add a competition title to continue." });

    expect(screen.getByRole("alert")).toHaveTextContent("Add a competition title to continue.");
  });
});
