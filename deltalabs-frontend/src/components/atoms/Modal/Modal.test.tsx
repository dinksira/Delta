/** @vitest-environment jsdom */
import React, { useState } from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import Modal from "./Modal";
/** ################################ TESTS ############################# */
/** Behaviour tests for the shared dialog. */

describe("Modal", () => {
  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <Modal isOpen={false} onClose={vi.fn()} title="Hidden">
        body
      </Modal>,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("renders the children when open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Visible">
        body
      </Modal>,
    );
    expect(screen.getByText("body")).toBeInTheDocument();
  });

  it("exposes dialog semantics", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Named">
        body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog", { name: "Named" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("prefers an explicit ariaLabel over the title", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Title" ariaLabel="Override">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Override" })).toBeInTheDocument();
  });

  it("can be named without a visible heading", () => {
    render(
      <Modal isOpen onClose={vi.fn()} showHeader={false} ariaLabel="Headerless">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog", { name: "Headerless" })).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("shows the heading and a labelled close button by default", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Closable">
        body
      </Modal>,
    );

    expect(screen.getByRole("heading", { name: "Closable" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("omits the header row when showHeader is false", () => {
    render(
      <Modal isOpen onClose={vi.fn()} showHeader={false} ariaLabel="Bare">
        body
      </Modal>,
    );
    expect(screen.queryByRole("button", { name: "Close dialog" })).not.toBeInTheDocument();
  });

  it("closes on the backdrop", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { container } = render(
      <Modal isOpen onClose={onClose} title="Backdrop">
        body
      </Modal>,
    );

    const backdrop = container.querySelector("[aria-hidden='true']");
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as HTMLElement);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes on Escape from inside the dialog", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <Modal isOpen onClose={onClose} title="Escape">
        <button type="button">inside</button>
      </Modal>,
    );

    await user.click(screen.getByRole("button", { name: "inside" }));
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus into the panel on open", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Focus">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("wraps Tab from the last control back to the first", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={vi.fn()} title="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </Modal>,
    );

    // The header close button is the first focusable in document order.
    const first = screen.getByRole("button", { name: "Close dialog" });
    const last = screen.getByRole("button", { name: "last" });

    last.focus();
    await user.tab();

    expect(first).toHaveFocus();
  });

  it("wraps Shift+Tab from the first control to the last", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={vi.fn()} title="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </Modal>,
    );

    screen.getByRole("button", { name: "Close dialog" }).focus();
    await user.tab({ shift: true });

    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("moves between controls without leaving the dialog", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={vi.fn()} title="Trap">
        <button type="button">first</button>
        <button type="button">last</button>
      </Modal>,
    );

    screen.getByRole("button", { name: "first" }).focus();
    await user.tab();

    expect(screen.getByRole("button", { name: "last" })).toHaveFocus();
  });

  it("keeps Tab inside when the panel holds no focusable elements", async () => {
    const user = userEvent.setup();
    render(
      <Modal isOpen onClose={vi.fn()} title="Empty" showHeader={false} ariaLabel="Empty">
        nothing focusable
      </Modal>,
    );

    await user.tab();
    expect(screen.getByRole("dialog")).toHaveFocus();
  });

  it("restores focus to the trigger when it closes", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            open
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Restore">
            body
          </Modal>
        </>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("button", { name: "open" });
    trigger.focus();
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toHaveFocus();

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(trigger).toHaveFocus();
  });

  it("locks and restores body scrolling", async () => {
    const user = userEvent.setup();

    function Harness() {
      const [isOpen, setIsOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setIsOpen(true)}>
            open
          </button>
          <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Scroll">
            body
          </Modal>
        </>
      );
    }

    document.body.style.overflow = "auto";
    render(<Harness />);
    await user.click(screen.getByRole("button", { name: "open" }));
    expect(document.body.style.overflow).toBe("hidden");

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(document.body.style.overflow).toBe("auto");
  });

  it("honours a caller max-width instead of the default", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Width" className="w-full max-w-2xl">
        body
      </Modal>,
    );
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveClass("max-w-2xl");
    expect(dialog).not.toHaveClass("max-w-4xl");
  });

  it("drops the default rounding when the caller supplies their own", () => {
    render(
      <Modal isOpen onClose={vi.fn()} title="Round" className="rounded-none">
        body
      </Modal>,
    );
    expect(screen.getByRole("dialog")).not.toHaveClass("rounded-3xl");
  });
});
/** ################################ /TESTS ############################# */
