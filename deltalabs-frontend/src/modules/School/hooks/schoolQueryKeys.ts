/** TanStack Query keys for School module data (aligned with Features hub patterns). */
export const schoolQueryKeys = {
  orgsMe: (userId?: string) => ["orgs", "me", userId ?? "anon"] as const,
  /** Cross-school list for the signed-in user (memberships + school-scoped roles). */
  mySchools: (userId?: string) => ["school", "me", "schools", userId ?? "anon"] as const,
  moduleStatus: () => ["school", "module-status"] as const,
  schools: (orgId: string, archived: boolean) => ["school", "schools", orgId, archived] as const,
  workspaceItems: (orgId: string, schoolId: string, itemType: string) =>
    ["school", "workspace", orgId, schoolId, itemType] as const,
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
} as const;
