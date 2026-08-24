"use client";

import type {
  GhostDto,
  GhostHostType,
  GhostImplementationType,
  GhostOpsTableBootstrapDto,
} from "@/modules/School/api";

export type GhostDrawerTab = "property" | "chain" | "history";

export type GhostHostContext = Readonly<{
  orgId: string;
  schoolId: string;
  hostType: GhostHostType;
  hostWorkspaceItemId: string;
  slotKey?: string;
  resourceKind?: string;
  defaultNodeName?: string;
}>;

export type GhostDrawerProps = Readonly<{
  open: boolean;
  host: GhostHostContext;
  ghostId: string | null;
  canMutate: boolean;
  onClose: () => void;
  onGhostCreated?: (ghost: GhostDto) => void;
  /**
   * When set (e.g. Course Exercise & Test), stay in-context after bootstrap.
   * When omitted, navigates to the standalone management-tables page.
   */
  onOpenOpsTable?: (boot: GhostOpsTableBootstrapDto) => void;
}>;

export const IMPLEMENTATION_OPTIONS: ReadonlyArray<{
  value: GhostImplementationType;
  label: string;
}> = [
  { value: "same_base", label: "Same Base" },
  { value: "branch_base", label: "Branch Base" },
];

export function implementationLabel(value: GhostImplementationType): string {
  return value === "branch_base" ? "Branch Base" : "Same Base";
}
