/** TanStack Query keys for School module data (aligned with Features hub patterns). */
export const schoolQueryKeys = {
  orgsMe: (userId?: string) => ["orgs", "me", userId ?? "anon"] as const,
  /** GET /v1/orgs/:orgId/access — org RBAC snapshot for gating school workspace mutations. */
  orgAccess: (userId: string | undefined, orgId: string | null) =>
    ["orgs", orgId ?? "none", "access", userId ?? "anon"] as const,
  /** Cross-school list for the signed-in user (memberships + school-scoped roles). */
  mySchools: (userId?: string) => ["school", "me", "schools", userId ?? "anon"] as const,
  moduleStatus: () => ["school", "module-status"] as const,
  schools: (orgId: string, archived: boolean) => ["school", "schools", orgId, archived] as const,
  /** `parentFolderId` is root workspace container when `"root"` (URL has no `path`). */
  workspaceItems: (orgId: string, schoolId: string, itemType: string, parentFolderId: string) =>
    ["school", "workspace", orgId, schoolId, itemType, parentFolderId] as const,
  workspaceItem: (orgId: string, schoolId: string, itemId: string) =>
    ["school", "workspace-item", orgId, schoolId, itemId] as const,
  /** GET …/classes/:classWorkspaceItemId/sessions */
  classSessions: (orgId: string, schoolId: string, classWorkspaceItemId: string) =>
    ["school", "class-sessions", orgId, schoolId, classWorkspaceItemId] as const,
  marketplace: (
    orgId: string,
    view: string,
    extras?: {
      q?: string;
      status?: string;
      schoolType?: string;
      sortBy?: string;
      sortDirection?: string;
      page?: number;
      pageSize?: number;
    },
  ) =>
    [
      "school",
      "marketplace",
      orgId,
      view,
      extras?.q ?? "",
      extras?.status ?? "",
      extras?.schoolType ?? "",
      extras?.sortBy ?? "created_at",
      extras?.sortDirection ?? "desc",
      extras?.page ?? 1,
      extras?.pageSize ?? 20,
    ] as const,
  offers: (orgId: string, status: string, view: string) => ["school", "offers", orgId, status, view] as const,
  managementTableDefinitions: (orgId: string, schoolId: string, scope: string) =>
    ["school", "management-tables", "definitions", orgId, schoolId, scope] as const,
  managementTableInstance: (orgId: string, schoolId: string, instanceId: string) =>
    ["school", "management-tables", "instance", orgId, schoolId, instanceId] as const,
  managementTableRows: (orgId: string, schoolId: string, instanceId: string, groupId: string, page: number) =>
    ["school", "management-tables", "rows", orgId, schoolId, instanceId, groupId, page] as const,
} as const;
