/**
 * types.ts
 *
 * Competition management-table types — mirrors School API shapes
 * so the generic table components work without school-specific imports.
 *
 * @example
 * ```tsx
 * const col: CompetitionManagementTableColumnDto = { id: "col_1", title: "Name", type: "text", order: 0 };
 * ```
 */

// ===== TYPES =====

export interface CompetitionManagementTableColumnDto {
  readonly id: string;
  readonly title: string;
  readonly type:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "checkbox"
    | "dropdown"
    | "status"
    | "link"
    | "phone";
  readonly order: number;
  readonly settings?: Record<string, unknown>;
}

export interface CompetitionManagementTableDefinitionDto {
  readonly id: string;
  readonly orgId: string;
  readonly schoolId: string;
  readonly title: string;
  readonly visibility: "self_owned" | "sharable";
  readonly sourceDefinitionId: string | null;
  readonly version: number;
  readonly columns: CompetitionManagementTableColumnDto[];
  readonly createdByUserId: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompetitionManagementTableGroupDto {
  readonly id: string;
  readonly title: string;
  readonly order: number;
  readonly color?: string;
}

export interface CompetitionManagementTableInstanceDto {
  readonly id: string;
  readonly orgId: string;
  readonly schoolId: string;
  readonly definitionId: string;
  readonly definitionVersion: number;
  readonly workspaceItemId: string | null;
  readonly tableKind: string | null;
  readonly title: string;
  readonly tableGroups: CompetitionManagementTableGroupDto[];
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompetitionManagementTableInstanceBundleDto {
  readonly instance: CompetitionManagementTableInstanceDto;
  readonly definition: CompetitionManagementTableDefinitionDto;
}

export interface CompetitionManagementTableRowDto {
  readonly id: string;
  readonly instanceId: string;
  readonly groupId: string | null;
  readonly parentRowId: string | null;
  readonly position: number;
  readonly cells: Record<string, unknown>;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompetitionManagementTableRowListResponseDto {
  readonly items: CompetitionManagementTableRowDto[];
  readonly total: number;
}

export type CompetitionBoardViewMode = "table" | "kanban";

export interface CompetitionTableFilters {
  readonly searchQuery: string;
  readonly statusFilter: string;
  readonly difficultyFilter: string;
  readonly viewMode: CompetitionBoardViewMode;
}