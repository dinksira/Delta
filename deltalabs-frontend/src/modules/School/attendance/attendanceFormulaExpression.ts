import type { AttendanceSessionRecord } from "@/modules/School/attendance/types";
import { markKey } from "@/modules/School/attendance/classAttendanceStorage";
import type { AttendanceMarkStatus } from "@/modules/School/attendance/types";

const COLUMN_REF_PATTERN = /\{([^{}]+)\}/g;

function cellNumericValue(status: AttendanceMarkStatus | undefined): number {
  if (status === "present" || status === "late") return 1;
  return 0;
}

/** Escape session title for use inside `{…}` reference. */
export function sessionColumnToken(title: string): string {
  return `{${title.trim()}}`;
}

/** Replace `{Session title}` tokens with numeric cell values for one student row. */
export function substituteSessionColumnRefs(
  expression: string,
  sessions: readonly AttendanceSessionRecord[],
  studentId: string,
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): string {
  const titleToValue = new Map<string, number>();
  for (const session of sessions) {
    titleToValue.set(session.title.trim(), cellNumericValue(marks[markKey(studentId, session.id)]));
  }

  return expression.replace(COLUMN_REF_PATTERN, (_match, rawTitle: string) => {
    const title = rawTitle.trim();
    const value = titleToValue.get(title);
    if (value === undefined) {
      throw new FormulaExpressionError(`Unknown column {${title}}`);
    }
    return String(value);
  });
}

export class FormulaExpressionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FormulaExpressionError";
  }
}

/** Expand SUM(1,2), AVERAGE(1,0,1), COUNT(1,0,1) after column substitution. */
function expandAggregateFunctions(input: string): string {
  let expr = input;
  const fnPattern = /\b(SUM|AVERAGE|COUNT|MIN|MAX)\s*\(\s*([^()]*?)\s*\)/i;

  for (let guard = 0; guard < 32; guard += 1) {
    const match = fnPattern.exec(expr);
    if (!match || match.index === undefined) break;

    const fn = match[1]!.toUpperCase();
    const args = match[2]!
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => parseFloat(s))
      .filter((n) => !Number.isNaN(n));

    let replacement = "0";
    if (args.length > 0) {
      switch (fn) {
        case "SUM":
          replacement = String(args.reduce((a, b) => a + b, 0));
          break;
        case "AVERAGE":
          replacement = String(Math.round((args.reduce((a, b) => a + b, 0) / args.length) * 1000) / 1000);
          break;
        case "COUNT":
          replacement = String(args.filter((v) => v > 0).length);
          break;
        case "MIN":
          replacement = String(Math.min(...args));
          break;
        case "MAX":
          replacement = String(Math.max(...args));
          break;
        default:
          replacement = "0";
      }
    }

    expr = expr.slice(0, match.index) + replacement + expr.slice(match.index + match[0].length);
  }

  return expr;
}

/** Safe numeric evaluator — numbers, + - * / ( ) only. No eval(). */
export function evaluateNumericExpression(expression: string): number {
  const tokens = tokenizeNumericExpression(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  const parseExpression = (): number => {
    let value = parseTerm();
    while (true) {
      const t = peek();
      if (!t || t.type !== "op" || (t.value !== "+" && t.value !== "-")) break;
      consume();
      const right = parseTerm();
      value = t.value === "+" ? value + right : value - right;
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    while (true) {
      const t = peek();
      if (!t || t.type !== "op" || (t.value !== "*" && t.value !== "/")) break;
      consume();
      const right = parseFactor();
      if (t.value === "/" && right === 0) throw new FormulaExpressionError("Division by zero");
      value = t.value === "*" ? value * right : value / right;
    }
    return value;
  };

  const parseFactor = (): number => {
    const t = peek();
    if (!t) throw new FormulaExpressionError("Unexpected end of expression");

    if (t.type === "op" && t.value === "-") {
      consume();
      return -parseFactor();
    }
    if (t.type === "op" && t.value === "+") {
      consume();
      return parseFactor();
    }
    if (t.type === "lparen") {
      consume();
      const value = parseExpression();
      if (peek()?.type !== "rparen") throw new FormulaExpressionError("Missing )");
      consume();
      return value;
    }
    if (t.type === "number") {
      consume();
      return t.value;
    }
    throw new FormulaExpressionError(`Unexpected token: ${t.type === "op" ? t.value : t.type}`);
  };

  const result = parseExpression();
  if (pos < tokens.length) throw new FormulaExpressionError("Unexpected characters after expression");
  return Math.round(result * 1000) / 1000;
}

type NumericToken =
  | { type: "number"; value: number }
  | { type: "op"; value: "+" | "-" | "*" | "/" }
  | { type: "lparen" }
  | { type: "rparen" };

function tokenizeNumericExpression(input: string): NumericToken[] {
  const tokens: NumericToken[] = [];
  let i = 0;
  const s = input.replace(/\s+/g, "");

  while (i < s.length) {
    const ch = s[i]!;
    if (ch === "(") {
      tokens.push({ type: "lparen" });
      i += 1;
      continue;
    }
    if (ch === ")") {
      tokens.push({ type: "rparen" });
      i += 1;
      continue;
    }
    if (ch === "+" || ch === "-" || ch === "*" || ch === "/") {
      tokens.push({ type: "op", value: ch });
      i += 1;
      continue;
    }
    if (/[0-9.]/.test(ch)) {
      let j = i + 1;
      while (j < s.length && /[0-9.]/.test(s[j]!)) j += 1;
      const num = parseFloat(s.slice(i, j));
      if (Number.isNaN(num)) throw new FormulaExpressionError("Invalid number");
      tokens.push({ type: "number", value: num });
      i = j;
      continue;
    }
    throw new FormulaExpressionError(`Invalid character: ${ch}`);
  }

  return tokens;
}

export function evaluateCustomFormulaExpression(
  expression: string,
  sessions: readonly AttendanceSessionRecord[],
  studentId: string,
  marks: Readonly<Record<string, AttendanceMarkStatus>>,
): number {
  const trimmed = expression.trim();
  if (!trimmed) return 0;

  const substituted = substituteSessionColumnRefs(trimmed, sessions, studentId, marks);
  const expanded = expandAggregateFunctions(substituted);
  return evaluateNumericExpression(expanded);
}

/** Validate syntax using sample zeros for all column refs. */
export function validateCustomFormulaExpression(
  expression: string,
  sessions: readonly AttendanceSessionRecord[],
): string | null {
  const trimmed = expression.trim();
  if (!trimmed) return "Enter a formula expression.";

  const unknownRef = findUnknownColumnRefs(trimmed, sessions);
  if (unknownRef) return `Unknown column {${unknownRef}}`;

  try {
    const sampleMarks: Record<string, AttendanceMarkStatus> = {};
    for (const session of sessions) {
      sampleMarks[markKey("__preview__", session.id)] = "present";
    }
    // Preview with 1 for present columns
    let preview = trimmed;
    for (const session of sessions) {
      preview = preview.split(sessionColumnToken(session.title)).join("1");
    }
    const expanded = expandAggregateFunctions(preview);
    evaluateNumericExpression(expanded);
    return null;
  } catch (e) {
    if (e instanceof FormulaExpressionError) return e.message;
    return "Invalid formula expression.";
  }
}

function findUnknownColumnRefs(expression: string, sessions: readonly AttendanceSessionRecord[]): string | null {
  const titles = new Set(sessions.map((s) => s.title.trim()));
  const refs = [...expression.matchAll(COLUMN_REF_PATTERN)];
  for (const ref of refs) {
    const title = ref[1]!.trim();
    if (!titles.has(title)) return title;
  }
  return null;
}

export function listColumnRefsInExpression(expression: string): readonly string[] {
  return [...expression.matchAll(COLUMN_REF_PATTERN)].map((m) => m[1]!.trim());
}
