/** @vitest-environment jsdom */
import React from "react";

import { fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import TimeSelectionModal from "./TimeSelectionModal";
import { formatLongDate } from "./dateGrid";
/** ################################ TESTS ############################# */
/** Behaviour tests for the calendar popover. */

/** Renders the modal and returns its props for assertions. */
function renderModal(overrides: Partial<React.ComponentProps<typeof TimeSelectionModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    onSelect: vi.fn(),
    selectedDate: "2026-03-10",
    ...overrides,
  };

  return { ...render(<TimeSelectionModal {...props} />), props };
}

/**
 * Day button for an ISO date, matched on the exact accessible name the grid
 * renders. Anchoring matters: a loose `/april 1/i` also matches April 10-19.
 */
function dayButton(iso: string) {
  return screen.getByRole("button", { name: formatLongDate(iso) });
}

describe("TimeSelectionModal", () => {
  beforeEach(() => {
    vi.setSystemTime(new Date("2026-03-05T09:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("labels the dialog and starts on the month containing the selection", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Estimated tutor time" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: /march 2026/i })).toBeInTheDocument();
  });

  it("marks the selected day on its gridcell, not the button", () => {
    renderModal();
    const selected = dayButton("2026-03-10").closest('[role="gridcell"]');
    expect(selected).toHaveAttribute("aria-selected", "true");
  });

  it("reports the chosen day and closes when time slots are hidden", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(dayButton("2026-03-12"));

    expect(props.onSelect).toHaveBeenCalledWith("2026-03-12");
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("keeps the popover open after choosing a day when time slots are shown", async () => {
    const user = userEvent.setup();
    const { props } = renderModal({ showTimeSlots: true });

    await user.click(dayButton("2026-03-12"));

    expect(props.onSelect).toHaveBeenCalledWith("2026-03-12");
    expect(props.onClose).not.toHaveBeenCalled();
  });

  it("disables days before minDate", () => {
    renderModal({ minDate: "2026-03-10" });
    expect(dayButton("2026-03-09")).toBeDisabled();
    expect(dayButton("2026-03-10")).toBeEnabled();
  });

  it("pads the first week so the 1st lands under its weekday", () => {
    renderModal();
    // March 2026 starts on a Sunday, so no leading padding cells are expected.
    const firstRow = screen.getAllByRole("row")[1];
    expect(within(firstRow).getByRole("button", { name: /march 1/i })).toBeInTheDocument();
  });

  it("moves focus with the arrow keys", async () => {
    const user = userEvent.setup();
    renderModal();

    const start = dayButton("2026-03-10");
    start.focus();
    await user.keyboard("{ArrowRight}");

    expect(dayButton("2026-03-11")).toHaveFocus();
  });

  it("crosses month boundaries and re-centres the view", async () => {
    const user = userEvent.setup();
    renderModal();

    dayButton("2026-03-31").focus();
    await user.keyboard("{ArrowRight}");

    expect(screen.getByRole("grid", { name: /april 2026/i })).toBeInTheDocument();
    expect(dayButton("2026-04-01")).toHaveFocus();
  });

  it("moves a whole month with PageDown and back with PageUp", async () => {
    const user = userEvent.setup();
    renderModal();

    dayButton("2026-03-10").focus();
    await user.keyboard("{PageDown}");
    expect(dayButton("2026-04-10")).toHaveFocus();

    await user.keyboard("{PageUp}");
    expect(dayButton("2026-03-10")).toHaveFocus();
  });

  it("closes on Escape exactly once", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    dayButton("2026-03-10").focus();
    await user.keyboard("{Escape}");

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("steps months with the header arrows without losing the selection", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: /next month/i }));
    expect(screen.getByRole("grid", { name: /april 2026/i })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /previous month/i }));
    expect(screen.getByRole("grid", { name: /march 2026/i })).toBeInTheDocument();
    expect(props.onSelect).not.toHaveBeenCalled();
  });

  it("selects today from the header shortcut", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: /today/i }));

    expect(props.onSelect).toHaveBeenCalledWith("2026-03-05");
  });

  it("closes on a pointer press on the backdrop", () => {
    const { props } = renderModal();
    const backdrop = document.querySelector('div[aria-hidden="true"]');
    fireEvent.pointerDown(backdrop!);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the time-slot pane only when asked", async () => {
    const user = userEvent.setup();
    const onTimeSelect = vi.fn();
    const { props } = renderModal({ showTimeSlots: true, selectedTime: "10:00 AM", onTimeSelect });

    await user.click(screen.getByRole("option", { name: "02:00 PM" }));

    expect(onTimeSelect).toHaveBeenCalledWith("02:00 PM");
    expect(props.onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("option", { name: /10:00 AM/ })).toHaveAttribute("aria-selected", "true");
  });

  it("merges a custom className onto the panel", () => {
    renderModal({ className: "w-48" });
    expect(screen.getByRole("dialog", { name: "Estimated tutor time" })).toHaveClass("w-48");
  });

  it("hides the slot pane by default", () => {
    renderModal();
    expect(screen.queryByRole("listbox", { name: /time slots/i })).not.toBeInTheDocument();
  });
});
/** ################################ /TESTS ############################# */
