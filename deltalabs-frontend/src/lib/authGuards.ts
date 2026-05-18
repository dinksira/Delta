import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { buildLoginModalRedirectHref } from "@/lib/authRedirect";
import { AUTH_SESSION_COOKIE, isAuthenticatedFromCookieValue } from "@/lib/authSession";

export async function requireAuthenticated(nextPath?: string): Promise<void> {
  if (typeof window === "undefined") {
    return;
  }
  const cookieStore = await cookies();
  const isAuthenticated = isAuthenticatedFromCookieValue(
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );
  if (!isAuthenticated) {
    redirect(buildLoginModalRedirectHref(nextPath));
  }
}
