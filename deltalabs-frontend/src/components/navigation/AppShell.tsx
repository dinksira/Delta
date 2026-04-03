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
  const isFeaturesRoute = pathname.startsWith("/features");
  const isSchoolWorkspace = pathname.startsWith("/features/school");
  const variant = isFeaturesRoute ? "features_authorized" : "landing_authorized";
  const { session, isReady } = useAuthSession();
  const profileInitials = isReady && session ? profileInitialsFromUser(session.user) : undefined;

  return (
    <FeatureTabsProvider>
      <div className="flex h-dvh max-h-dvh min-h-0 w-full flex-col overflow-hidden bg-surface-canvas">
        <TopNav
          variant={variant}
          isAuthenticated
          profileInitials={profileInitials}
          sessionPending={!isReady}
        />
        <main
          className={[
            "min-h-0 w-full flex-1",
            isSchoolWorkspace
              ? "flex flex-col overflow-hidden px-6 md:px-8 xl:px-10"
              : isFeaturesRoute
                ? "flex flex-col overflow-y-auto overscroll-y-contain px-6 py-6 md:px-8 xl:px-10"
                : "mx-auto flex max-w-6xl flex-col overflow-y-auto overscroll-y-contain px-2 py-6 md:px-3",
          ].join(" ")}
        >
          {children}
        </main>
      </div>
    </FeatureTabsProvider>
  );
}
