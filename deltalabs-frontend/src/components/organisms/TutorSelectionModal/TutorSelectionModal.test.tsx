/** @vitest-environment jsdom */
import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TutorSelectionModal from "./TutorSelectionModal";
import type { Tutor } from "./TutorSelectionModal.types";
/** ################################ TESTS ############################# */
/** Behaviour tests for the tutor picker. */

/** Two distinct tutors; the old fixture had eight entries with three repeats. */
const TUTORS: readonly Tutor[] = [
  { id: "t1", name: "Abebe Kebede", title: "Professor" },
  { id: "t2", name: "Lomi Kebede", title: "PhD in Physics" },
];

/** Renders the dialog with sensible defaults. */
function renderModal(overrides: Partial<React.ComponentProps<typeof TutorSelectionModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    tutors: TUTORS,
    ...overrides,
  };
  return { ...render(<TutorSelectionModal {...props} />), props };
}

describe("TutorSelectionModal", () => {
  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("is a named modal dialog", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Select tutors" })).toBeInTheDocument();
  });

  it("takes tutors from props instead of a built-in list", () => {
    renderModal({ tutors: [{ id: "x", name: "Only Person", title: "Tutor" }] });
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(1);
    expect(screen.getByText("Only Person")).toBeInTheDocument();
  });

  it("exposes each tutor as a toggle button, not a clickable div", () => {
    renderModal();
    const card = screen.getByRole("button", { name: /Abebe Kebede/ });
    expect(card).toHaveAttribute("aria-pressed", "false");
  });

  it("marks selected tutors as pressed", () => {
    renderModal({ selectedTutorIds: ["t1"] });
    expect(screen.getByRole("button", { name: /Abebe Kebede/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Lomi Kebede/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("reports a toggle with the full tutor record", async () => {
    const user = userEvent.setup();
    const onToggleTutor = vi.fn();
    renderModal({ onToggleTutor });

    await user.click(screen.getByRole("button", { name: /Lomi Kebede/ }));

    expect(onToggleTutor).toHaveBeenCalledWith(TUTORS[1]);
  });

  it("toggles with the keyboard", async () => {
    const user = userEvent.setup();
    const onToggleTutor = vi.fn();
    renderModal({ onToggleTutor });

    screen.getByRole("button", { name: /Abebe Kebede/ }).focus();
    await user.keyboard("{Enter}");

    expect(onToggleTutor).toHaveBeenCalledTimes(1);
  });

  it("filters by name", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Search tutors"), "lomi");

    expect(screen.getByText("Lomi Kebede")).toBeInTheDocument();
    expect(screen.queryByText("Abebe Kebede")).not.toBeInTheDocument();
  });

  it("filters by title", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Search tutors"), "physics");

    expect(screen.getByText("Lomi Kebede")).toBeInTheDocument();
    expect(screen.queryByText("Abebe Kebede")).not.toBeInTheDocument();
  });

  it("searches case-insensitively", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Search tutors"), "ABEBE");

    expect(screen.getByText("Abebe Kebede")).toBeInTheDocument();
  });

  it("shows an empty state when nothing matches", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Search tutors"), "zzzz");

    expect(screen.getByText("No tutors match your search.")).toBeInTheDocument();
  });

  it("accepts a custom empty message", async () => {
    const user = userEvent.setup();
    renderModal({ emptyMessage: "No tutors available." });

    await user.type(screen.getByLabelText("Search tutors"), "zzzz");

    expect(screen.getByText("No tutors available.")).toBeInTheDocument();
  });

  it("renders a monogram avatar, not a remote image", () => {
    renderModal();
    // No next/image <img> for a tutor without an avatarUrl.
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });

  it("uses the shared Switch for auto match", async () => {
    const user = userEvent.setup();
    const onAutoMatchChange = vi.fn();
    renderModal({ onAutoMatchChange });

    const toggle = screen.getByRole("switch", { name: "Auto match" });
    expect(toggle).toHaveAttribute("aria-checked", "false");

    await user.click(toggle);

    expect(onAutoMatchChange).toHaveBeenCalledWith(true);
  });

  it("reflects the auto-match prop", () => {
    renderModal({ autoMatch: true });
    expect(screen.getByRole("switch", { name: "Auto match" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
  });

  it("disables confirm until something is selected", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /Invite/ })).toBeDisabled();
  });

  it("confirms the selected ids and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({ selectedTutorIds: ["t1", "t2"], onConfirm, onClose });

    await user.click(screen.getByRole("button", { name: /Invite \(2\)/ }));

    expect(onConfirm).toHaveBeenCalledWith(["t1", "t2"]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("closes without confirming on Escape", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({ selectedTutorIds: ["t1"], onConfirm, onClose });

    await user.keyboard("{Escape}");

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("does not crash without the optional callbacks", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /Abebe Kebede/ }));
    await user.click(screen.getByRole("switch", { name: "Auto match" }));
  });
});
/** ################################ /TESTS ############################# */
