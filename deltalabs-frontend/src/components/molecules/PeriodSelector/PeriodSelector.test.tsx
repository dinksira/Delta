/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PeriodSelector } from "./PeriodSelector";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
const OPTIONS = ["Month", "Quarter", "Year"] as const;

function renderSelector(overrides?: Partial<{ onChange: (value: string) => void }>) {
  const onChange = overrides?.onChange ?? vi.fn();

  render(
    <PeriodSelector
      value="Year"
      options={OPTIONS}
      onChange={onChange}
      ariaLabel="Enrollment period"
    />,
  );

  return { onChange, trigger: screen.getByRole("button", { name: /Year/ }) };
}

describe("PeriodSelector", () => {
  it("exposes the trigger as a collapsed listbox popup", () => {
    const { trigger } = renderSelector();

    expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("opens the labelled listbox on click and reflects expanded state", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelector();

    await user.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("listbox", { name: "Enrollment period" })).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("marks only the current value as selected", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelector();

    await user.click(trigger);

    expect(screen.getByRole("option", { name: "Year" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("option", { name: "Month" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("reports the chosen value and closes", async () => {
    const user = userEvent.setup();
    const { onChange, trigger } = renderSelector();

    await user.click(trigger);
    await user.click(screen.getByRole("option", { name: "Quarter" }));

    expect(onChange).toHaveBeenCalledWith("Quarter");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelector();

    await user.click(trigger);
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it("moves between options with the arrow keys", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelector();

    await user.click(trigger);
    // Open with ArrowDown from the trigger, landing on the selected option.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Year" })).toHaveFocus();

    // Arrow wraps backwards from the last option to the first.
    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: "Month" })).toHaveFocus();
  });

  it("dismisses when a pointer press lands outside the component", async () => {
    const user = userEvent.setup();
    const { trigger } = renderSelector();

    await user.click(trigger);
    expect(screen.getByRole("listbox")).toBeInTheDocument();

    await user.click(document.body);
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
/** ################################ /COMPONENT ############################# */
