export const AUTH_SESSION_COOKIE = "dl_session";

export function isAuthenticatedFromCookieValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}
