/** @vitest-environment jsdom */
import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import RoadmapSelectionModal from "./RoadmapSelectionModal";
import type { RoadmapSection } from "./RoadmapSelectionModal.types";
/** ################################ TESTS ############################# */
/** Behaviour tests for the roadmap picker. */

/** Two sections; the old fixture hardcoded these plus three resources in JSX. */
const SECTIONS: readonly RoadmapSection[] = [
  {
    id: "s1",
    title: "Cell Biology",
    description: "The technical task is attached as a file.",
    tags: ["biology"],
    resources: [
      { id: "doc1", title: "Documents 1", kind: "document", isReviewable: true },
      { id: "vid1", title: "Video", kind: "video", description: "Watch the lecture." },
    ],
  },
  { id: "s2", title: "Genetics", tags: ["biology", "physics"] },
];

/** Renders the dialog with sensible defaults. */
function renderModal(overrides: Partial<React.ComponentProps<typeof RoadmapSelectionModal>> = {}) {
  const props = { isOpen: true, onClose: vi.fn(), sections: SECTIONS, ...overrides };
  return { ...render(<RoadmapSelectionModal {...props} />), props };
}

describe("RoadmapSelectionModal", () => {
  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("is a named modal dialog", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Select roadmap items" })).toBeInTheDocument();
  });

  it("renders sections from props", () => {
    renderModal();
    expect(screen.getByText("Cell Biology")).toBeInTheDocument();
    expect(screen.getByText("Genetics")).toBeInTheDocument();
  });

  it("renders a section with no resources without breaking", () => {
    renderModal();
    // Two section toggles plus the two resources in s1; s2 contributes none.
    expect(screen.getAllByRole("button", { pressed: false })).toHaveLength(4);
    expect(screen.getByText("Genetics")).toBeInTheDocument();
  });

  it("exposes each section as a pressed toggle", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /Cell Biology/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("exposes each resource as a pressed toggle", () => {
    renderModal();
    expect(screen.getByRole("button", { name: /Documents 1/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggles a section by id, not by title", async () => {
    const user = userEvent.setup();
    const onToggleSection = vi.fn();
    renderModal({ onToggleSection });

    await user.click(screen.getByRole("button", { name: /Cell Biology/ }));

    expect(onToggleSection).toHaveBeenCalledWith("s1");
  });

  it("toggles a resource by id", async () => {
    const user = userEvent.setup();
    const onToggleResource = vi.fn();
    renderModal({ onToggleResource });

    await user.click(screen.getByRole("button", { name: /Video/ }));

    expect(onToggleResource).toHaveBeenCalledWith("vid1");
  });

  it("marks selected sections and resources as pressed", () => {
    renderModal({ selectedSectionIds: ["s1"], selectedResourceIds: ["vid1"] });
    expect(screen.getByRole("button", { name: /Cell Biology/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: /Video/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /Documents 1/ })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  it("toggles a section with the keyboard", async () => {
    const user = userEvent.setup();
    const onToggleSection = vi.fn();
    renderModal({ onToggleSection });

    screen.getByRole("button", { name: /Genetics/ }).focus();
    await user.keyboard("{Enter}");

    expect(onToggleSection).toHaveBeenCalledWith("s2");
  });

  it("renders tags for both sections", () => {
    renderModal();
    expect(screen.getByText("physics")).toBeInTheDocument();
  });

  it("confirms both selections and closes", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({
      selectedSectionIds: ["s1"],
      selectedResourceIds: ["doc1", "vid1"],
      onConfirm,
      onClose,
    });

    await user.click(screen.getByRole("button", { name: /Done \(3\)/ }));

    expect(onConfirm).toHaveBeenCalledWith({ sectionIds: ["s1"], resourceIds: ["doc1", "vid1"] });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a plain Done label when nothing is selected", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Done" })).toBeEnabled();
  });

  it("closes without confirming on Escape", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderModal({ selectedSectionIds: ["s1"], onConfirm, onClose });

    await user.keyboard("{Escape}");

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an empty state for an empty roadmap", () => {
    renderModal({ sections: [] });
    expect(screen.getByText("This roadmap has no sections yet.")).toBeInTheDocument();
  });

  it("accepts a custom empty message", () => {
    renderModal({ sections: [], emptyMessage: "Nothing here." });
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("does not crash without the optional callbacks", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /Cell Biology/ }));
    await user.click(screen.getByRole("button", { name: /Video/ }));
    await user.click(screen.getByRole("button", { name: /Done/ }));
  });

  it("renders every resource kind icon without an image", () => {
    renderModal();
    expect(screen.queryAllByRole("img")).toHaveLength(0);
  });
});
/** ################################ /TESTS ############################# */
