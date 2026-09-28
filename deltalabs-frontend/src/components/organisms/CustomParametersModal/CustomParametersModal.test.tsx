/** @vitest-environment jsdom */
import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import CustomParametersModal from "./CustomParametersModal";
/** ################################ TESTS ############################# */
/** Behaviour tests for the custom parameters dialog. */

/** Renders the dialog open, returning its spies. */
function renderModal() {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(
    <CustomParametersModal isOpen onClose={onClose} onAdd={onAdd} />,
  );
  return { onAdd, onClose };
}

/** All name inputs, in row order. */
function nameInputs() {
  return screen.getAllByLabelText("Parameter name");
}

/** All value inputs, in row order. */
function valueInputs() {
  return screen.getAllByLabelText("Parameter value");
}

describe("CustomParametersModal", () => {
  it("renders nothing while closed", () => {
    const { container } = render(
      <CustomParametersModal isOpen={false} onClose={vi.fn()} onAdd={vi.fn()} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("is a named modal dialog", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Custom parameters" })).toBeInTheDocument();
  });

  it("starts with two blank rows", () => {
    renderModal();
    expect(nameInputs()).toHaveLength(2);
    expect(valueInputs()).toHaveLength(2);
  });

  it("adds a row", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Add a parameter row" }));

    expect(nameInputs()).toHaveLength(3);
  });

  it("removes the last row from the header control", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Remove the last parameter row" }));

    expect(nameInputs()).toHaveLength(1);
  });

  it("allows removing a lone row, falling back to the empty state", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getAllByRole("button", { name: "Remove parameter" })[0]);

    expect(nameInputs()).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Remove parameter" })[0]).toBeEnabled();
  });

  it("labels the per-row removal control with the parameter name", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[0], "Session length");

    expect(
      screen.getByRole("button", { name: "Remove parameter Session length" }),
    ).toBeInTheDocument();
  });

  it("removes the specific row clicked", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[1], "Second");
    await user.click(screen.getByRole("button", { name: "Remove parameter Second" }));

    expect(nameInputs()).toHaveLength(1);
    expect(nameInputs()[0]).toHaveValue("");
  });

  it("does not reuse a row id after a middle row is removed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[1], "Middle");
    await user.click(screen.getByRole("button", { name: "Remove parameter Middle" }));
    await user.click(screen.getByRole("button", { name: "Add a parameter row" }));

    // The added row must be a distinct input, not a recycled one.
    const names = nameInputs();
    expect(names).toHaveLength(2);
    await user.type(names[1], "Fresh");

    expect(nameInputs()[1]).toHaveValue("Fresh");
    expect(nameInputs()[0]).toHaveValue("");
  });

  it("keeps submit disabled while a row is half filled", async () => {
    const user = userEvent.setup();
    renderModal();

    const submit = screen.getByRole("button", { name: "Add parameters" });
    expect(submit).toBeDisabled();

    await user.type(nameInputs()[0], "Session length");
    expect(submit).toBeDisabled();
  });

  it("keeps submit disabled when every row is blank", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Add parameters" })).toBeDisabled();
  });

  it("rejects a value with no name", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(valueInputs()[0], "90 minutes");

    expect(screen.getByRole("alert")).toHaveTextContent("Add a name for this value.");
    expect(screen.getByRole("button", { name: "Add parameters" })).toBeDisabled();
  });

  it("rejects a name with no value", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[0], "Session length");

    expect(screen.getByRole("alert")).toHaveTextContent('Add a value for "Session length".');
  });

  it("clears the error once the row is completed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[0], "Session length");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    await user.type(valueInputs()[0], "90 minutes");

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Add parameters" })).toBeEnabled();
  });

  it("marks an invalid input for assistive tech", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[0], "Session length");

    expect(nameInputs()[0]).toHaveAttribute("aria-invalid", "true");
  });

  it("submits only completed rows, dropping blank ones", async () => {
    const user = userEvent.setup();
    const { onAdd, onClose } = renderModal();

    await user.type(nameInputs()[0], "Session length");
    await user.type(valueInputs()[0], "90 minutes");

    await user.click(screen.getByRole("button", { name: "Add parameters" }));

    expect(onAdd).toHaveBeenCalledTimes(1);
    expect(onAdd.mock.calls[0][0]).toHaveLength(1);
    expect(onAdd.mock.calls[0][0][0]).toMatchObject({
      name: "Session length",
      value: "90 minutes",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("trims surrounding whitespace on submit", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderModal();

    await user.type(nameInputs()[0], "Session length");
    await user.type(valueInputs()[0], "  90 minutes  ");
    await user.click(screen.getByRole("button", { name: "Add parameters" }));

    expect(onAdd.mock.calls[0][0][0]).toMatchObject({
      name: "Session length",
      value: "90 minutes",
    });
  });

  it("resets to blank rows after a submit", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(nameInputs()[0], "Session length");
    await user.type(valueInputs()[0], "90 minutes");
    await user.click(screen.getByRole("button", { name: "Add parameters" }));

    expect(nameInputs()).toHaveLength(2);
    expect(nameInputs()[0]).toHaveValue("");
  });

  it("shows an empty state when every row is removed", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Remove the last parameter row" }));
    await user.click(screen.getByRole("button", { name: "Remove the last parameter row" }));

    expect(screen.getByText(/no parameters yet/i)).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not call onAdd when closed by Escape mid-edit", async () => {
    const user = userEvent.setup();
    const { onAdd } = renderModal();

    await user.type(nameInputs()[0], "Session length");
    await user.keyboard("{Escape}");

    expect(onAdd).not.toHaveBeenCalled();
  });

  it("uses a custom accessible name", () => {
    render(
      <CustomParametersModal isOpen onClose={vi.fn()} onAdd={vi.fn()} ariaLabel="Extra requests" />,
    );
    expect(screen.getByRole("dialog", { name: "Extra requests" })).toBeInTheDocument();
  });

  it("closes from the visible close button", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CustomParametersModal isOpen onClose={onClose} onAdd={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Close dialog" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("stays dismissable by pointer while submit is blocked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<CustomParametersModal isOpen onClose={onClose} onAdd={vi.fn()} />);

    // Remove every row. Submit is then disabled, so the close button is the
    // only pointer-reachable exit left.
    const removeLast = () => screen.queryByRole("button", { name: "Remove the last parameter row" });
    for (let guard = 0; removeLast() && guard < 10; guard += 1) {
      await user.click(removeLast() as HTMLElement);
    }
    expect(screen.getByRole("button", { name: "Add parameters" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "Close dialog" }));
    expect(onClose).toHaveBeenCalled();
  });
});
/** ################################ /TESTS ############################# */
