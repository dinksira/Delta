import type { ReactNode } from "react";
import { cookies } from "next/headers";

import { PublicFooter } from "@/components/navigation/PublicFooter";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { AUTH_SESSION_COOKIE, isAuthenticatedFromCookieValue } from "@/lib/authSession";

export default async function PublicLayout({ children }: Readonly<{ children: ReactNode }>) {
  const cookieStore = await cookies();
  const isAuthenticated = isAuthenticatedFromCookieValue(
    cookieStore.get(AUTH_SESSION_COOKIE)?.value,
  );

  return (
    <div className="flex min-h-full flex-col bg-surface-canvas">
      <PublicHeader isAuthenticated={isAuthenticated} />
      <div className="flex flex-1 flex-col">{children}</div>
      <PublicFooter />
    </div>
  );
}
