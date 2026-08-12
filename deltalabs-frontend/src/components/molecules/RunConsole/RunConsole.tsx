/**
 * RunConsole
 * Atomic Level: Molecule
 *
 * Real execution console for the Code Editor module. Displays the output of a
 * `Run` (stdout / stderr / compile error) or the per-test grading results of a
 * `Submit`, both produced by the backend judge service (POST
 * /v1/competitions/execute + /submit). Supersedes MockRunConsole — no output is
 * fabricated here.
 *
 * @example
 * <RunConsole
 *   status="running"
 *   result={runResult}
 *   submitResults={null}
 *   onRun={handleRun}
 *   onReset={clearResult}
 * />
 */

import { Loader2, Play, RotateCcw, X } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import type { CodeExecuteResponse } from "@/modules/Competition/types/codeExecution";
import type { CodeRunTestCase } from "@/modules/Competition/types/codeExecution";

export type RunConsoleStatus = "idle" | "running" | "done";

export interface RunConsoleProps {
  status: RunConsoleStatus;
  /** Single Run result (null until a Run completes). */
  result?: CodeExecuteResponse | null;
  /** Submit grading results (null until a Submit completes). */
  submitResults?: CodeRunTestCase[] | null;
  /** Network / judge failure message to surface inline. */
  error?: string | null;
  onRun: () => void;
  onReset: () => void;
  onDismissError: () => void;
  className?: string;
}

function PreviewBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 flex-1">
      <span className="text-text-tertiary">{label}</span>
      <pre className="mt-0.5 overflow-x-auto whitespace-pre-wrap rounded-md bg-surface-default p-2 font-mono text-xs text-text-primary">
        {value || <span className="text-text-tertiary">—</span>}
      </pre>
    </div>
  );
}

export function RunConsole({
  status,
  result,
  submitResults,
  error,
  onRun,
  onReset,
  onDismissError,
  className,
}: Readonly<RunConsoleProps>) {
  const isSubmitView = submitResults !== null && submitResults !== undefined;
  const passedCount = isSubmitView
    ? submitResults.filter((tc) => tc.passed).length
    : 0;

  return (
    <div
      className={cn(
        "flex min-h-40 flex-col gap-2 rounded-lg border border-border-default bg-surface-muted/40 p-3",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Play className="size-3.5 text-primary-600" aria-hidden />
          <Typography as="span" className="text-xs font-semibold text-text-primary">
            Run console
          </Typography>
          {status === "done" && isSubmitView && (
            <Typography
              as="span"
              className={cn(
                "text-xs font-medium",
                passedCount === submitResults.length
                  ? "text-success-600"
                  : "text-error-600",
              )}
            >
              {passedCount}/{submitResults.length} cases passed
            </Typography>
          )}
          {status === "done" && !isSubmitView && result?.run.exitCode === 0 && (
            <Typography as="span" className="text-xs font-medium text-success-600">
              Finished (exit 0)
            </Typography>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {status === "done" && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              <RotateCcw className="size-3.5" aria-hidden />
              Clear
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={onRun} disabled={status === "running"}>
            <Play className="size-3.5" aria-hidden />
            Run
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-start justify-between gap-2 rounded-md border border-error-200 bg-error-50 px-3 py-2">
          <Typography className="text-xs text-error-700">{error}</Typography>
          <button
            type="button"
            aria-label="Dismiss error"
            onClick={onDismissError}
            className="shrink-0 text-error-600 hover:text-error-800"
          >
            <X className="size-3.5" aria-hidden />
          </button>
        </div>
      )}

      {status === "idle" && !error && (
        <Typography className="text-xs text-text-tertiary">
          Run the code to compile and execute it, or Submit to grade the test
          cases against the backend judge.
        </Typography>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Running on the judge service…
        </div>
      )}

      {status === "done" && isSubmitView && (
        <ul className="flex max-h-72 flex-col gap-2 overflow-y-auto pr-1">
          {submitResults.map((tc) => (
            <li
              key={tc.index}
              className={cn(
                "rounded-md bg-surface-default p-2 text-xs",
                tc.passed ? "border-l-2 border-l-success-500" : "border-l-2 border-l-error-500",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={cn(
                    "font-semibold",
                    tc.passed ? "text-success-700" : "text-error-700",
                  )}
                >
                  Case {tc.index + 1} — {tc.passed ? "Passed" : "Failed"}
                </span>
                <span className="font-mono text-text-tertiary">
                  exit {tc.exitCode}
                </span>
              </div>
              <div className="mt-1.5 flex flex-col gap-1.5">
                <PreviewBlock label="Input:" value={tc.input} />
                <PreviewBlock label="Expected:" value={tc.expectedOutput} />
                {tc.actualOutput !== "" && (
                  <PreviewBlock label="Actual:" value={tc.actualOutput} />
                )}
                {tc.errorMessage && tc.errorMessage !== "Accepted" && (
                  <PreviewBlock label="Error:" value={tc.errorMessage} />
                )}
                {tc.stderr && <PreviewBlock label="stderr:" value={tc.stderr} />}
              </div>
            </li>
          ))}
        </ul>
      )}

      {status === "done" && !isSubmitView && result && (
        <div className="flex flex-col gap-1.5">
          {(result.run.compileOutput || result.run.stderr) && (
            <PreviewBlock
              label={result.run.compileOutput ? "Compile error:" : "stderr:"}
              value={result.run.compileOutput || result.run.stderr}
            />
          )}
          {result.run.errorLine !== null && (
            <Typography className="text-xs text-error-600">
              Error on line {result.run.errorLine}
            </Typography>
          )}
          {result.run.stdout !== "" && (
            <PreviewBlock label="stdout:" value={result.run.stdout} />
          )}
          {result.run.stdout === "" && !result.run.compileOutput && !result.run.stderr && (
            <Typography className="text-xs text-text-tertiary">
              Program ran with no output (exit {result.run.exitCode}).
            </Typography>
          )}
        </div>
      )}
    </div>
  );
}

export default RunConsole;
