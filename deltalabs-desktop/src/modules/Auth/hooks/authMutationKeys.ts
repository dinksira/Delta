/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Single prefix for TanStack mutations + global pending UI. */
export const authMutationKeys = {
  all: ["auth"] as const,
  login: ["auth", "login"] as const,
  signup: ["auth", "signup"] as const,
  recover: ["auth", "recover"] as const,
  resetPassword: ["auth", "resetPassword"] as const,
} as const;
/** ################################ /COMPONENT ############################# */
