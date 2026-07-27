/**
 * useCustomTable
 * State hook for a customizable empty table: columns and rows.
 */

import { useState, useCallback } from "react";
import type { CustomTableColumn, CustomTableRow } from "@/modules/Competition/types/public";

// ============================================================================
// RETURN TYPE
// ============================================================================

export interface UseCustomTableResult {
  columns: CustomTableColumn[];
  rows: CustomTableRow[];
  addColumn: () => void;
  addRow: () => void;
  updateColumnLabel: (columnId: string, label: string) => void;
  updateCell: (rowId: string, columnId: string, value: string) => void;
  removeColumn: (columnId: string) => void;
  removeRow: (rowId: string) => void;
  toggleRowSelection: (rowId: string) => void;
  selectedRows: Set<string>;
  selectAll: boolean;
  toggleSelectAll: () => void;
}

let columnCounter = 0;
let rowCounter = 0;

// ============================================================================
// HOOK
// ============================================================================

export function useCustomTable(): UseCustomTableResult {
  const [columns, setColumns] = useState<CustomTableColumn[]>([]);
  const [rows, setRows] = useState<CustomTableRow[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  const addColumn = useCallback(() => {
    columnCounter++;
    const newCol: CustomTableColumn = {
      id: `col-${columnCounter}`,
      label: `Column ${columnCounter}`,
      type: "text",
    };
    setColumns((prev) => [...prev, newCol]);
  }, []);

  const addRow = useCallback(() => {
    rowCounter++;
    const newRow: CustomTableRow = {
      id: `row-${rowCounter}`,
      cells: Object.fromEntries(columns.map((c) => [c.id, ""])),
    };
    setRows((prev) => [...prev, newRow]);
  }, [columns]);

  const updateColumnLabel = useCallback((columnId: string, label: string) => {
    setColumns((prev) =>
      prev.map((c) => (c.id === columnId ? { ...c, label } : c)),
    );
  }, []);

  const updateCell = useCallback(
    (rowId: string, columnId: string, value: string) => {
      setRows((prev) =>
        prev.map((r) =>
          r.id === rowId
            ? { ...r, cells: { ...r.cells, [columnId]: value } }
            : r,
        ),
      );
    },
    [],
  );

  const removeColumn = useCallback((columnId: string) => {
    setColumns((prev) => prev.filter((c) => c.id !== columnId));
    setRows((prev) =>
      prev.map((r) => {
        const { [columnId]: _, ...rest } = r.cells;
        return { ...r, cells: rest };
      }),
    );
  }, []);

  const removeRow = useCallback((rowId: string) => {
    setRows((prev) => prev.filter((r) => r.id !== rowId));
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.delete(rowId);
      return next;
    });
  }, []);

  const toggleRowSelection = useCallback((rowId: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === rows.length && rows.length > 0) return new Set();
      return new Set(rows.map((r) => r.id));
    });
  }, [rows]);

  const selectAll = selectedRows.size > 0 && selectedRows.size === rows.length;

  return {
    columns,
    rows,
    addColumn,
    addRow,
    updateColumnLabel,
    updateCell,
    removeColumn,
    removeRow,
    toggleRowSelection,
    selectedRows,
    selectAll,
    toggleSelectAll,
  };
}
