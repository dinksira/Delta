/**
 * codeExecution types
 * Mirror the backend judge service (POST /v1/competitions/execute + /submit).
 */

/** stdout/stderr/exit code from a single program execution. */
export interface CodeRunResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  compileOutput: string;
  /** Best-effort 1-based error line parsed from stderr/compile output. */
  errorLine: number | null;
  errorMessage: string;
}

export interface CodeExecuteResponse {
  run: CodeRunResult;
  runtime: string;
  runtimeVersion: string;
}

/** Per-test result produced by Submit grading. */
export interface CodeRunTestCase {
  index: number;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  passed: boolean;
  actualOutput: string;
  stderr: string;
  exitCode: number;
  compileOutput: string;
  errorLine: number | null;
  errorMessage: string;
}

export interface CodeSubmitResponse {
  results: CodeRunTestCase[];
  passedCount: number;
  totalCount: number;
  allPassed: boolean;
}
