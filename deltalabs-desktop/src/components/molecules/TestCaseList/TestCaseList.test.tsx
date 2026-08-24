/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TestCaseList } from "@/components/molecules/TestCaseList/TestCaseList";
import type { TestCase } from "@/modules/Competition/types/createBattle";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
describe("TestCaseList", () => {
  const cases: TestCase[] = [
    { input: "1", expectedOutput: "2", isSample: true },
    { input: "x", expectedOutput: "y", isHidden: true },
  ];

  it("renders one TestCaseCard per authored test", () => {
    render(
      <TestCaseList
        testCases={cases}
        onUpdate={vi.fn()}
        onToggleSample={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText("Test #1")).toBeTruthy();
    expect(screen.getByText("Test #2")).toBeTruthy();
  });

  it("shows the empty state with an add action when there are no tests", () => {
    render(
      <TestCaseList
        testCases={[]}
        onUpdate={vi.fn()}
        onToggleSample={vi.fn()}
        onRemove={vi.fn()}
        onAdd={vi.fn()}
      />,
    );
    expect(screen.getByText("No test cases yet")).toBeTruthy();
  });

  it("fires onRemove for the removed test index", () => {
    const onRemove = vi.fn();
    render(
      <TestCaseList
        testCases={cases}
        onUpdate={vi.fn()}
        onToggleSample={vi.fn()}
        onRemove={onRemove}
        onAdd={vi.fn()}
      />,
    );
    const removeButtons = screen.getAllByLabelText(/Remove test case/);
    expect(removeButtons.length).toBe(2);
    fireEvent.click(removeButtons[1]);
    expect(onRemove).toHaveBeenCalledWith(1);
  });

  it("fires onAdd from the trailing add button", () => {
    const onAdd = vi.fn();
    render(
      <TestCaseList
        testCases={cases}
        onUpdate={vi.fn()}
        onToggleSample={vi.fn()}
        onRemove={vi.fn()}
        onAdd={onAdd}
      />,
    );
    fireEvent.click(screen.getByText("Add test case"));
    expect(onAdd).toHaveBeenCalledTimes(1);
  });
});
/** ################################ /COMPONENT ############################# */
