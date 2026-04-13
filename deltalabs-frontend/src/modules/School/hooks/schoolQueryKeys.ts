/** TanStack Query keys for School module data (aligned with Features hub patterns). */
export const schoolQueryKeys = {
  orgsMe: () => ["orgs", "me"] as const,
  moduleStatus: () => ["school", "module-status"] as const,
} as const;
