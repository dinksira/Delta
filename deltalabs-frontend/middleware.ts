import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { buildLoginModalRedirectHref } from "@/lib/authRedirect";
import { AUTH_SESSION_COOKIE, isAuthenticatedFromCookieValue } from "@/lib/authSession";

const PROTECTED_PATHS = ["/features", "/dashboard", "/enrolled-courses"] as const;
const PUBLIC_AUTH_PAGES = ["/login", "/signup"] as const;

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

function isAuthPage(pathname: string): boolean {
  return PUBLIC_AUTH_PAGES.some((path) => pathname === path || pathname.startsWith(`${path}/`));
}

export function middleware(request: NextRequest): NextResponse {
  const pathname = request.nextUrl.pathname;
  const isAuthenticated = isAuthenticatedFromCookieValue(
    request.cookies.get(AUTH_SESSION_COOKIE)?.value,
  );

  if (isProtectedPath(pathname) && !isAuthenticated) {
    const loginUrl = new URL(buildLoginModalRedirectHref(pathname), request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage(pathname) && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/features/:path*", "/dashboard/:path*", "/enrolled-courses/:path*", "/login", "/signup"],
};
