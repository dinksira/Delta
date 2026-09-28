/** @vitest-environment jsdom */
import React from "react";

import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Popover from "./Popover";
/** ################################ TESTS ############################# */
/** Behaviour tests for the shared popover chrome. */

/** Renders an open popover with a trigger-like relative parent. */
function renderPopover(overrides: Partial<React.ComponentProps<typeof Popover>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    ariaLabel: "Test popover",
    children: <button type="button">Inside</button>,
    ...overrides,
  };

  const view = render(
    <div className="relative">
      <Popover {...props} />
    </div>,
  );

  return { ...view, props };
}

describe("Popover", () => {
  it("renders nothing while closed", () => {
    const { container } = renderPopover({ isOpen: false });
    expect(container.querySelector("[role='dialog']")).toBeNull();
  });

  it("labels the panel as a dialog", () => {
    renderPopover();
    expect(screen.getByRole("dialog", { name: "Test popover" })).toBeInTheDocument();
  });

  it("renders its children", () => {
    renderPopover();
    expect(screen.getByRole("button", { name: "Inside" })).toBeInTheDocument();
  });

  it("closes on Escape exactly once", async () => {
    const user = userEvent.setup();
    const { props } = renderPopover();

    screen.getByRole("button", { name: "Inside" }).focus();
    await user.keyboard("{Escape}");

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("does not run onKeyDown for Escape, to avoid a double close", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    renderPopover({ onKeyDown });

    screen.getByRole("button", { name: "Inside" }).focus();
    await user.keyboard("{Escape}");

    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("forwards other keys to onKeyDown", async () => {
    const user = userEvent.setup();
    const onKeyDown = vi.fn();
    renderPopover({ onKeyDown });

    screen.getByRole("button", { name: "Inside" }).focus();
    await user.keyboard("{ArrowDown}");

    expect(onKeyDown).toHaveBeenCalledTimes(1);
  });

  it("closes on a pointer press on the backdrop", () => {
    const { props } = renderPopover();
    fireEvent.pointerDown(document.querySelector('div[aria-hidden="true"]')!);
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  it("hides the backdrop from assistive tech", () => {
    renderPopover();
    expect(document.querySelector('div[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("applies the placement classes", () => {
    renderPopover({ placement: "right" });
    expect(screen.getByRole("dialog")).toHaveClass("right-0");
  });

  it("merges a custom className onto the panel", () => {
    renderPopover({ className: "min-w-64" });
    expect(screen.getByRole("dialog")).toHaveClass("min-w-64");
  });
});
/** ################################ /TESTS ############################# */
