/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SlotsStepper } from "@/components/molecules/SlotsStepper/SlotsStepper";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
describe("SlotsStepper", () => {
  it("enables −/＋ when the slot count is inside the range", () => {
    render(
      <SlotsStepper value={4} min={2} max={8} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Decrease player slots")).not.toBeDisabled();
    expect(screen.getByLabelText("Increase player slots")).not.toBeDisabled();
  });

  it("disables − at min and + at max, and clamps the display", () => {
    render(
      <SlotsStepper value={2} min={2} max={2} onChange={vi.fn()} />,
    );
    expect(screen.getByLabelText("Decrease player slots")).toBeDisabled();
    expect(screen.getByLabelText("Increase player slots")).toBeDisabled();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
  });

  it("decrements and increments by one inside the range", () => {
    const onChange = vi.fn();
    render(<SlotsStepper value={5} min={2} max={8} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText("Decrease player slots"));
    expect(onChange).toHaveBeenCalledWith(4);
    fireEvent.click(screen.getByLabelText("Increase player slots"));
    expect(onChange).toHaveBeenCalledWith(6);
  });

  it("stops incrementing at max", () => {
    const onChange = vi.fn();
    render(<SlotsStepper value={8} min={2} max={8} onChange={onChange} />);
    expect(screen.getByLabelText("Increase player slots")).toBeDisabled();
    fireEvent.click(screen.getByLabelText("Decrease player slots"));
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it("renders the format banner when provided", () => {
    render(
      <SlotsStepper
        value={4}
        min={2}
        max={8}
        onChange={vi.fn()}
        formatTitle="Format: Tournament (8 Players)"
        formatDescription="This format supports up to 8 players maximum"
      />,
    );
    expect(screen.getByText("Format: Tournament (8 Players)")).toBeTruthy();
  });
});
/** ################################ /COMPONENT ############################# */
