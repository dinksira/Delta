"use client";

import { useEffect } from "react";

import type { ManagementTableInstanceBundleDto } from "@/modules/School/api";
import {
  bundleMatchesTableKind,
  type ManagementTableWorkspaceKind,
} from "@/modules/School/managementTable/managementTableWorkspaceKind";

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
  bundle: ManagementTableInstanceBundleDto | undefined;
  canMutate: boolean;
  bootstrapPending: boolean;
  onRepair: () => void;
  /** Extra schema checks (e.g. parents table must have a Parent column). */
  isBundleValid?: (bundle: ManagementTableInstanceBundleDto) => boolean;
}>) {
  useEffect(() => {
    if (!canMutate || !instanceId || bootstrapPending || !bundle) return;
    const kindOk = bundleMatchesTableKind(bundle, tableKind);
    const schemaOk = isBundleValid ? isBundleValid(bundle) : true;
    if (kindOk && schemaOk) return;
    onRepair();
  }, [bundle, bootstrapPending, canMutate, instanceId, isBundleValid, onRepair, tableKind]);
}
