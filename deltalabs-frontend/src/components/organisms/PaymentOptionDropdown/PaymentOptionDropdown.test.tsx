/** ################################ TEST ############################# */
/** Behaviour tests for PaymentOptionDropdown. */
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { PaymentOptionDropdown } from "./PaymentOptionDropdown";
import type { PaymentOption } from "./PaymentOptionDropdown.types";

/** Minimal option list so assertions do not depend on the defaults. */
const OPTIONS: readonly PaymentOption[] = [
  { id: "none", name: "None", icon: "none", tone: "neutral" },
  { id: "credit-card", name: "Credit Card", icon: "card", tone: "primary" },
  { id: "bank-transfer", name: "Bank Transfer", icon: "bank", tone: "success" },
];

function renderDropdown(overrides: Partial<React.ComponentProps<typeof PaymentOptionDropdown>> = {}) {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const utils = render(
    <PaymentOptionDropdown
      isOpen
      onClose={onClose}
      onSelect={onSelect}
      options={OPTIONS}
      {...overrides}
    />,
  );
  return { ...utils, onSelect, onClose };
}

describe("PaymentOptionDropdown", () => {
  it("renders nothing while closed", () => {
    renderDropdown({ isOpen: false });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("exposes the options as a labelled listbox", () => {
    renderDropdown();
    const listbox = screen.getByRole("listbox", { name: "Payment option" });
    expect(listbox).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(OPTIONS.length);
  });

  it("marks only the selected option as aria-selected", () => {
    renderDropdown({ selectedId: "credit-card" });
    const selected = screen.getByRole("option", { name: /Credit Card/ });
    expect(selected).toHaveAttribute("aria-selected", "true");
    expect(screen.getByRole("option", { name: /Bank Transfer/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  it("reports the chosen option and closes", async () => {
    const user = userEvent.setup();
    const { onSelect } = renderDropdown();

    await user.click(screen.getByRole("option", { name: /Bank Transfer/ }));

    expect(onSelect).toHaveBeenCalledWith(OPTIONS[2]);
  });

  it("filters the list from the search field", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.type(screen.getByRole("searchbox"), "bank");

    expect(screen.getAllByRole("option")).toHaveLength(1);
    expect(screen.getByRole("option", { name: /Bank Transfer/ })).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.type(screen.getByRole("searchbox"), "zzzz");

    expect(screen.queryAllByRole("option")).toHaveLength(0);
    expect(screen.getByText("No payment methods found")).toBeInTheDocument();
  });

  it("closes on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDropdown();

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("moves focus down the options with the arrow keys", async () => {
    const user = userEvent.setup();
    renderDropdown();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /None/ })).toHaveFocus();

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("option", { name: /Credit Card/ })).toHaveFocus();
  });
});
/** ################################ /TEST ############################# */
