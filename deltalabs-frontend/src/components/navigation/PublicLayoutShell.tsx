"use client";

import type { ReactNode } from "react";

import { AuthModalGateway } from "@/components/features/auth/AuthModalGateway";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { PublicHeader } from "@/components/navigation/PublicHeader";
import { profileInitialsFromUser } from "@/lib/authDisplay";

type PublicLayoutShellProps = Readonly<{
  children: ReactNode;
  /** Server-visible session (e.g. httpOnly cookie). Merged with client mock/real session. */
  serverAuthenticated: boolean;
}>;

/**
 * Public routes: header + auth modal respect both server cookies and client session
 * (localStorage mock or future client-hydrated tokens).
 */
export function PublicLayoutShell({ children, serverAuthenticated }: PublicLayoutShellProps) {
  const { session, isReady } = useAuthSession();

  const isAuthenticated = serverAuthenticated || (isReady && session != null);
  /** Until client storage is read, avoid rendering Login/Sign up (prevents refresh flash). */
  const sessionPending = !isReady && !serverAuthenticated;
  const profileInitials =
    session && isReady ? profileInitialsFromUser(session.user) : undefined;

  return (
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-surface-canvas">
      <PublicHeader
        isAuthenticated={isAuthenticated}
        profileInitials={profileInitials}
        sessionPending={sessionPending}
      />
      <AuthModalGateway enabled={!isAuthenticated} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
