/** ################################ HOOK ############################# */
/**
 * Row state for {@link CustomParametersModal}.
 *
 * Row ids come from a monotonic counter rather than the row count. Deriving the
 * id from `rows.length + 1` (as the previous version did) collides as soon as a
 * middle row is removed: rows 1,2,3 then dropping row 2 makes the next add
 * produce id "3" again, so React reuses a key and the wrong input keeps focus.
 */

import { useCallback, useMemo, useState } from "react";

import type { CustomParameter } from "./CustomParametersModal.types";

/** Blank starting rows. */
const INITIAL_ROWS: readonly CustomParameter[] = [
  { id: "row-1", name: "", value: "" },
  { id: "row-2", name: "", value: "" },
];

/** Monotonic across the module so ids are never reused within a session. */
let nextRowId = INITIAL_ROWS.length;

/** Problem found on a single row, keyed by row id. */
export type RowErrors = Readonly<Record<string, string>>;

/** Value returned by {@link useParameterRows}. */
export interface UseParameterRowsResult {
  /** Current rows, including any blank ones. */
  rows: readonly CustomParameter[];
  /** Per-row validation messages. */
  errors: RowErrors;
  /** True when at least one row is complete and no row is invalid. */
  canSubmit: boolean;
  /** Appends an empty row. */
  addRow: () => void;
  /** Removes a row; may remove the last one. */
  removeRow: (id: string) => void;
  /** Updates one field of one row. */
  updateRow: (id: string, field: "name" | "value", next: string) => void;
  /**
   * Resets to the starting rows and returns the completed ones, dropping blank
   * rows so empty inputs are never handed to the caller.
   */
  submit: () => CustomParameter[];
}

/**
 * Validates one row. A wholly blank row is not an error — it is simply ignored
 * on submit — but a half-filled row is, because it is almost always a mistake.
 */
function validateRow(row: CustomParameter): string | undefined {
  const hasName = row.name.trim().length > 0;
  const hasValue = row.value.trim().length > 0;
  if (hasName && !hasValue) {
    return `Add a value for "${row.name.trim()}".`;
  }
  if (hasValue && !hasName) {
    return "Add a name for this value.";
  }
  return undefined;
}

/** Owns the parameter rows, their edits, and their validation. */
export function useParameterRows(): UseParameterRowsResult {
  const [rows, setRows] = useState<readonly CustomParameter[]>(INITIAL_ROWS);

  const addRow = useCallback(() => {
    nextRowId += 1;
    setRows((current) => [...current, { id: `row-${nextRowId}`, name: "", value: "" }]);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((current) => current.filter((row) => row.id !== id));
  }, []);

  const updateRow = useCallback((id: string, field: "name" | "value", next: string) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [field]: next } : row)),
    );
  }, []);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    for (const row of rows) {
      const message = validateRow(row);
      if (message) {
        next[row.id] = message;
      }
    }
    return next;
  }, [rows]);

  const completed = useMemo(
    () => rows.filter((row) => row.name.trim() && row.value.trim()),
    [rows],
  );

  const submit = useCallback(() => {
    const result = completed.map((row) => ({
      ...row,
      name: row.name.trim(),
      value: row.value.trim(),
    }));
    setRows(INITIAL_ROWS);
    return result;
  }, [completed]);

  return { rows, errors, canSubmit: completed.length > 0 && Object.keys(errors).length === 0, addRow, removeRow, updateRow, submit };
}
/** ################################ /HOOK ############################# */
