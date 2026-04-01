"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { useAuthSession } from "@/contexts/AuthSession_Context";
import { FeatureTabsProvider } from "@/contexts/FeatureTabs_Context";
import { TopNav } from "@/components/navigation/TopNav";
import { profileInitialsFromUser } from "@/lib/authDisplay";

/** Authenticated app chrome: top bar and main content region. */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const variant = pathname.startsWith("/features") ? "features_authorized" : "landing_authorized";
  const { session } = useAuthSession();
  const profileInitials = session ? profileInitialsFromUser(session.user) : undefined;

  return (
    <FeatureTabsProvider>
      <div className="flex min-h-full flex-col bg-surface-canvas">
        <TopNav variant={variant} isAuthenticated profileInitials={profileInitials} />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-2 py-6 md:px-3">{children}</main>
      </div>
    </FeatureTabsProvider>
  );
}
