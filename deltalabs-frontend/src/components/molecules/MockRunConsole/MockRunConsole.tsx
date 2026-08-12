/**
 * MockRunConsole
 * Atomic Level: Molecule
 *
 * @deprecated Superseded by RunConsole (real backend judge output). Kept only
 * as a UI stub; do not wire new consumers to it. It simulates Run output by
 * echoing sample test cases — no real execution.
 *
 * @example
 * <MockRunConsole testCases={sampleCases} status="running" onClear={reset} />
 */

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Play, RotateCcw } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";
import type { TestCase } from "@/modules/Competition/types/createBattle";

export type MockRunStatus = "idle" | "running" | "done";

export interface MockRunConsoleProps {
  /** Sample (visible) test cases to echo in the console. */
  testCases: readonly TestCase[];
  status: MockRunStatus;
  onRun: () => void;
  onReset: () => void;
  className?: string;
}

export function MockRunConsole({
  testCases,
  status,
  onRun,
  onReset,
  className,
}: Readonly<MockRunConsoleProps>) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (status !== "running") {
      setElapsed(0);
      return;
    }
    const timer = window.setInterval(() => {
      setElapsed((prev) => Math.min(prev + 0.1, 0.9));
    }, 100);
    return () => window.clearInterval(timer);
  }, [status]);

  const samples = testCases.filter((tc) => tc.isSample === true);

  return (
    <div className={cn("flex min-h-40 flex-col gap-2 rounded-lg border border-border-default bg-surface-muted/40 p-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Play className="size-3.5 text-primary-600" aria-hidden />
          <Typography as="span" className="text-xs font-semibold text-text-primary">
            Run console
          </Typography>
          {status === "done" && (
            <Typography as="span" className="text-xs font-medium text-success-600">
              {samples.length} sample case{samples.length === 1 ? "" : "s"} previewed
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

      {status === "idle" && (
        <Typography className="text-xs text-text-tertiary">
          Run the sample test cases to preview their expected output. (No code
          executor is connected — this is a preview of the authored answers.)
        </Typography>
      )}

      {status === "running" && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Loader2 className="size-3.5 animate-spin" aria-hidden />
          Running {samples.length} sample case{samples.length === 1 ? "" : "s"}…
          <span className="tabular-nums">{elapsed.toFixed(1)}s</span>
        </div>
      )}

      {status === "done" &&
        (samples.length === 0 ? (
          <Typography className="text-xs text-text-tertiary">
            No sample test cases yet — mark a test as “Sample” to preview it here.
          </Typography>
        ) : (
          <ul className="flex flex-col gap-2">
            {samples.map((tc, index) => (
              <li key={`${tc.input}-${index}`} className="rounded-md bg-surface-default p-2 font-mono text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-3.5 shrink-0 text-success-600" aria-hidden />
                  <span className="font-semibold text-text-primary">Sample case {index + 1}</span>
                </div>
                <div className="mt-1 grid grid-cols-1 gap-1 md:grid-cols-2">
                  <div>
                    <span className="text-text-tertiary">Input: </span>
                    <span className="whitespace-pre-wrap text-text-primary">{tc.input || "—"}</span>
                  </div>
                  <div>
                    <span className="text-text-tertiary">Expected: </span>
                    <span className="whitespace-pre-wrap text-text-primary">{tc.expectedOutput || "—"}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ))}
    </div>
  );
}

export default MockRunConsole;
