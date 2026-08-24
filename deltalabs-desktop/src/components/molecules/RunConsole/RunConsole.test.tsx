/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunConsole } from "@/components/molecules/RunConsole/RunConsole";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
describe("RunConsole", () => {
  const noop = () => {};

  it("shows the idle hint before any run", () => {
    render(<RunConsole status="idle" onRun={noop} onReset={noop} onDismissError={noop} />);
    expect(screen.getByText(/Run the code to compile/)).toBeTruthy();
  });

  it("reports a runtime error line from a Run result", () => {
    render(
      <RunConsole
        status="done"
        result={{
          run: {
            stdout: "",
            stderr: 'Traceback (most recent call last):\n  File "script.py", line 3, in <module>',
            exitCode: 1,
            compileOutput: "",
            errorLine: 3,
            errorMessage: "Traceback (most recent call last):",
          },
          runtime: "Python",
          runtimeVersion: "",
        }}
        onRun={noop}
        onReset={noop}
        onDismissError={noop}
      />,
    );
    expect(screen.getByText(/Error on line 3/)).toBeTruthy();
  });

  it("summarises Submit grading pass/fail counts", () => {
    render(
      <RunConsole
        status="done"
        submitResults={[
          {
            index: 0,
            input: "hi",
            expectedOutput: "hi",
            isSample: false,
            passed: true,
            actualOutput: "hi",
            stderr: "",
            exitCode: 0,
            compileOutput: "",
            errorLine: null,
            errorMessage: "Accepted",
          },
          {
            index: 1,
            input: "yo",
            expectedOutput: "YO",
            isSample: false,
            passed: false,
            actualOutput: "yo",
            stderr: "",
            exitCode: 0,
            compileOutput: "",
            errorLine: null,
            errorMessage: "Accepted",
          },
        ]}
        onRun={noop}
        onReset={noop}
        onDismissError={noop}
      />,
    );
    expect(screen.getByText(/1\/2 cases passed/)).toBeTruthy();
    expect(screen.getByText(/Case 2 — Failed/)).toBeTruthy();
  });

  it("surfaces an inline judge error", () => {
    render(
      <RunConsole
        status="done"
        error="Judge service unreachable"
        onRun={noop}
        onReset={noop}
        onDismissError={noop}
      />,
    );
    expect(screen.getByText("Judge service unreachable")).toBeTruthy();
  });
});
/** ################################ /COMPONENT ############################# */
