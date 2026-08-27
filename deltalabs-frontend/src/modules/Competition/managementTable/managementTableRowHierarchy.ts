/**
 * managementTableRowHierarchy.ts
 *
 * Helpers for flattening and grouping parent/child management-table rows
 * into a display-ready hierarchy.
 *
 * @example
 * ```tsx
 * const flat = flattenManagementTableRows(rows);
 * ```
 */

import type { CompetitionManagementTableRowDto } from "@/modules/Competition/managementTable/types";

export type CompetitionManagementTableFlatRow = Readonly<{
  row: CompetitionManagementTableRowDto;
  depth: number;
  hasChildren: boolean;
}>;

export type CompetitionManagementTableHierarchyBlock = Readonly<{
  parent: CompetitionManagementTableFlatRow;
  /** Direct + nested descendants, in display order (depth relative to parent). */
  descendants: readonly CompetitionManagementTableFlatRow[];
}>;

// ===== HELPERS =====

function readParentId(row: CompetitionManagementTableRowDto): string {
  if (typeof row.parentRowId === "string" && row.parentRowId.trim()) return row.parentRowId.trim();
  const snake = (row as { parent_row_id?: unknown }).parent_row_id;
  return typeof snake === "string" ? snake.trim() : "";
}

/** Flatten parent/child rows for Monday-style nested display. Parents start collapsed unless listed in `expandedIds`. */
export function flattenManagementTableRows(
  rows: readonly CompetitionManagementTableRowDto[],
  expandedIds: ReadonlySet<string>,
): CompetitionManagementTableFlatRow[] {
  const idSet = new Set(rows.map((r) => r.id));
  const byParent = new Map<string | null, CompetitionManagementTableRowDto[]>();

  for (const row of rows) {
    const raw = readParentId(row);
    const parentId = raw && idSet.has(raw) ? raw : null;
    const list = byParent.get(parentId) ?? [];
    list.push(row);
    byParent.set(parentId, list);
  }

  for (const list of byParent.values()) {
    list.sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
  }

  const out: CompetitionManagementTableFlatRow[] = [];
  const walk = (parentId: string | null, depth: number) => {
    for (const row of byParent.get(parentId) ?? []) {
      const children = byParent.get(row.id) ?? [];
      out.push({ row, depth, hasChildren: children.length > 0 });
      if (children.length > 0 && expandedIds.has(row.id)) {
        walk(row.id, depth + 1);
      }
    }
  };
  walk(null, 0);
  return out;
}

/** Group flattened rows into parent + descendant blocks (for nested sub-table UI). */
export function groupHierarchyBlocks(
  flatRows: readonly CompetitionManagementTableFlatRow[],
): CompetitionManagementTableHierarchyBlock[] {
  const blocks: CompetitionManagementTableHierarchyBlock[] = [];
  let i = 0;
  while (i < flatRows.length) {
    const parent = flatRows[i]!;
    if (parent.depth !== 0) {
      // Orphan nested row — treat as its own parent block.
      blocks.push({ parent, descendants: [] });
      i += 1;
      continue;
    }
    const descendants: CompetitionManagementTableFlatRow[] = [];
    i += 1;
    while (i < flatRows.length && flatRows[i]!.depth > 0) {
      descendants.push(flatRows[i]!);
      i += 1;
    }
    blocks.push({ parent, descendants });
  }
  return blocks;
}
