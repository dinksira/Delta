/**
 * useCodeExecution
 *
 * Run / Submit state machine for the Code Editor module backed by the backend
 * judge service (POST /v1/competitions/execute + /submit). Exposes the console
 * status, the latest single-run result, Submit grading results, any inline
 * judge/network error, and the parsed error line for editor decoration.
 *
 * @example
 * const { status, result, submitResults, error, errorLine, run, submit, reset } =
 *   useCodeExecution({ language, code, testCases });
 */

import { useCallback, useState } from "react";

import { executeCode, submitCode } from "@/modules/Competition/api";
import type { TestCase } from "@/modules/Competition/types/createBattle";
import type {
  CodeExecuteResponse,
  CodeRunTestCase,
} from "@/modules/Competition/types/codeExecution";
import type { RunConsoleStatus } from "@/components/molecules/RunConsole/RunConsole";

export interface UseCodeExecutionParams {
  language: string;
  code: string;
  testCases: readonly TestCase[];
}

export interface UseCodeExecutionResult {
  status: RunConsoleStatus;
  result: CodeExecuteResponse | null;
  submitResults: CodeRunTestCase[] | null;
  error: string | null;
  /** 1-based error line from the last Run or Submit (for editor decoration). */
  errorLine: number | null;
  busy: boolean;
  run: () => Promise<void>;
  submit: () => Promise<void>;
  reset: () => void;
  dismissError: () => void;
}

function toMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function useCodeExecution({
  language,
  code,
  testCases,
}: UseCodeExecutionParams): UseCodeExecutionResult {
  const [status, setStatus] = useState<RunConsoleStatus>("idle");
  const [result, setResult] = useState<CodeExecuteResponse | null>(null);
  const [submitResults, setSubmitResults] = useState<CodeRunTestCase[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorLine, setErrorLine] = useState<number | null>(null);
  const [submitBusy, setSubmitBusy] = useState(false);

  const run = useCallback(async () => {
    if (status === "running" || submitBusy) return;
    setStatus("running");
    setError(null);
    setSubmitResults(null);
    setErrorLine(null);
    try {
      const response = await executeCode({ language, code });
      setResult(response);
      setErrorLine(response.run.errorLine);
      setStatus("done");
    } catch (err) {
      setResult(null);
      setError(toMessage(err, "Run failed."));
      setStatus("done");
    }
  }, [code, language, status, submitBusy]);

  const submit = useCallback(async () => {
    if (submitBusy || status === "running") return;
    if (testCases.length === 0) {
      setStatus("done");
      setError("Add at least one test case before submitting.");
      return;
    }
    setSubmitBusy(true);
    setStatus("running");
    setError(null);
    setResult(null);
    setErrorLine(null);
    try {
      const response = await submitCode({
        language,
        code,
        testCases: testCases.map((tc) => ({
          input: tc.input,
          expectedOutput: tc.expectedOutput,
        })),
      });
      setSubmitResults(response.results);
      const firstError = response.results.find((tc) => tc.errorLine !== null);
      setErrorLine(firstError?.errorLine ?? null);
      setStatus("done");
    } catch (err) {
      setSubmitResults(null);
      setError(toMessage(err, "Submit failed."));
      setStatus("done");
    } finally {
      setSubmitBusy(false);
    }
  }, [code, language, status, submitBusy, testCases]);

  const reset = useCallback(() => {
    setStatus("idle");
    setResult(null);
    setSubmitResults(null);
    setError(null);
    setErrorLine(null);
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return {
    status,
    result,
    submitResults,
    error,
    errorLine,
    busy: status === "running" || submitBusy,
    run,
    submit,
    reset,
    dismissError,
  };
}

export default useCodeExecution;
