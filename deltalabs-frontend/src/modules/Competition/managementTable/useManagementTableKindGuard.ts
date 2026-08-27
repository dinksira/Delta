/**
 * useManagementTableKindGuard.ts
 *
 * Hook that detects legacy shared instances and triggers re-bootstrap
 * when the instance doesn't match the expected table kind.
 *
 * @example
 * ```tsx
 * useManagementTableKindGuard({ tableKind: "competitions", ... });
 * ```
 */

"use client";

import { useEffect } from "react";

import type { CompetitionManagementTableInstanceBundleDto } from "@/modules/Competition/managementTable/types";
import {
  bundleMatchesTableKind,
  type ManagementTableWorkspaceKind,
} from "@/modules/Competition/managementTable/managementTableWorkspaceKind";

// ===== HOOK =====

/**
 * When class metadata still points at a shared legacy instance, re-bootstrap the correct
 * specialized table (grades, parents, schedules, etc.).
 */
export function useManagementTableKindGuard({
  tableKind,
  instanceId,
  bundle,
  canMutate,
  bootstrapPending,
  onRepair,
  isBundleValid,
}: Readonly<{
  tableKind: ManagementTableWorkspaceKind;
  instanceId: string | null;
  bundle: CompetitionManagementTableInstanceBundleDto | undefined;
  canMutate: boolean;
  bootstrapPending: boolean;
  onRepair: () => void;
  /** Extra schema checks (e.g. parents table must have a Parent column). */
  isBundleValid?: (bundle: CompetitionManagementTableInstanceBundleDto) => boolean;
}>) {
  useEffect(() => {
    if (!canMutate || !instanceId || bootstrapPending || !bundle) return;
    const kindOk = bundleMatchesTableKind(bundle, tableKind);
    const schemaOk = isBundleValid ? isBundleValid(bundle) : true;
    if (kindOk && schemaOk) return;
    onRepair();
  }, [bundle, bootstrapPending, canMutate, instanceId, isBundleValid, onRepair, tableKind]);
}
