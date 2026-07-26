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
  /** GET …/classes/:classWorkspaceItemId/attendance */
  classAttendance: (orgId: string, schoolId: string, classWorkspaceItemId: string) =>
    ["school", "class-attendance", orgId, schoolId, classWorkspaceItemId] as const,
  /** GET …/classes/:classWorkspaceItemId/enrollments */
  classEnrollments: (orgId: string, schoolId: string, classWorkspaceItemId: string) =>
    ["school", "class-enrollments", orgId, schoolId, classWorkspaceItemId] as const,
  /** GET/PUT …/classes/:classWorkspaceItemId/roadmap */
  classRoadmap: (orgId: string, schoolId: string, classWorkspaceItemId: string) =>
    ["school", "class-roadmap", orgId, schoolId, classWorkspaceItemId] as const,
  /** GET …/classes/:classWorkspaceItemId/roadmap/resources */
  classRoadmapResources: (orgId: string, schoolId: string, classWorkspaceItemId: string) =>
    ["school", "class-roadmap-resources", orgId, schoolId, classWorkspaceItemId] as const,
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
  /** GET …/courses/:courseId/qa/questions */
  courseQaQuestions: (orgId: string, schoolId: string, courseId: string, q: string, tag: string) =>
    ["school", "course-qa", "questions", orgId, schoolId, courseId, q, tag] as const,
  /** GET …/courses/:courseId/qa/questions/:questionId */
  courseQaQuestion: (orgId: string, schoolId: string, courseId: string, questionId: string) =>
    ["school", "course-qa", "question", orgId, schoolId, courseId, questionId] as const,
  /** GET …/courses/:courseId/exercises?kind= */
  courseExercises: (orgId: string, schoolId: string, courseId: string, kind: string) =>
    ["school", "course-exercises", orgId, schoolId, courseId, kind] as const,
  courseExercise: (orgId: string, schoolId: string, courseId: string, exerciseId: string) =>
    ["school", "course-exercises", "detail", orgId, schoolId, courseId, exerciseId] as const,
  /** GET …/courses/:courseId/summaries */
  courseSummaries: (orgId: string, schoolId: string, courseId: string) =>
    ["school", "course-summaries", orgId, schoolId, courseId] as const,
  courseSummary: (orgId: string, schoolId: string, courseId: string, summaryId: string) =>
    ["school", "course-summaries", "detail", orgId, schoolId, courseId, summaryId] as const,
  /** GET …/courses/:courseId/scoreboard */
  courseScoreboard: (orgId: string, schoolId: string, courseId: string) =>
    ["school", "course-scoreboard", orgId, schoolId, courseId] as const,
  /** GET …/courses/:courseId/supplements */
  courseSupplements: (
    orgId: string,
    schoolId: string,
    courseId: string,
    kind: string,
    ghostsOnly: boolean,
  ) => ["school", "course-supplements", orgId, schoolId, courseId, kind, ghostsOnly] as const,
  /** GET …/ghosts?hostType=&hostId= */
  ghosts: (orgId: string, schoolId: string, hostType: string, hostId: string) =>
    ["school", "ghosts", orgId, schoolId, hostType, hostId] as const,
  /** GET …/ghosts/:ghostId */
  ghost: (orgId: string, schoolId: string, ghostId: string) =>
    ["school", "ghost", orgId, schoolId, ghostId] as const,
  /** GET …/ghosts/:ghostId/events */
  ghostEvents: (orgId: string, schoolId: string, ghostId: string) =>
    ["school", "ghost-events", orgId, schoolId, ghostId] as const,
  /** GET …/ghosts/my-work */
  ghostMyWork: (orgId: string, schoolId: string) =>
    ["school", "ghost-my-work", orgId, schoolId] as const,
} as const;
