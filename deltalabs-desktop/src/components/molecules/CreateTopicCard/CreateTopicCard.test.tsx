/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CreateTopicCard } from "@/components/molecules/CreateTopicCard/CreateTopicCard";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
describe("CreateTopicCard", () => {
  const subjects = [
    { value: "Science", label: "Science" },
    { value: "History", label: "History" },
  ];

  it("expands into the form when the idle tile is clicked", () => {
    render(<CreateTopicCard subjects={subjects} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Create your own topic"));
    expect(screen.getByLabelText("Topic name")).toBeTruthy();
    expect(screen.getByText("Create topic")).toBeTruthy();
  });

  it("emits the entered topic on submit", () => {
    const onCreate = vi.fn();
    render(<CreateTopicCard subjects={subjects} onCreate={onCreate} />);
    fireEvent.click(screen.getByLabelText("Create your own topic"));
    fireEvent.change(screen.getByLabelText("Topic name"), {
      target: { value: "World History Sprint" },
    });
    fireEvent.click(screen.getByText("Create topic"));
    expect(onCreate).toHaveBeenCalledWith({
      name: "World History Sprint",
      category: "Science",
      difficulty: "Mixed",
    });
  });

  it("keeps Create disabled until a name is entered", () => {
    render(<CreateTopicCard subjects={subjects} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Create your own topic"));
    expect(screen.getByText("Create topic")).toBeDisabled();
  });

  it("collapses and resets on Cancel", () => {
    render(<CreateTopicCard subjects={subjects} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByLabelText("Create your own topic"));
    fireEvent.change(screen.getByLabelText("Topic name"), {
      target: { value: "Temp" },
    });
    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Topic name")).not.toBeInTheDocument();
  });
});
/** ################################ /COMPONENT ############################# */
