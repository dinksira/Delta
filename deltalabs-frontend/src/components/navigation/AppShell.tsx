"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { TopNav } from "@/components/navigation/TopNav";

/** Authenticated app chrome: top bar and main content region. */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  const pathname = usePathname();
  const variant = pathname.startsWith("/features") ? "features_authorized" : "landing_authorized";

  return (
    <div className="flex min-h-full flex-col bg-surface-canvas">
      <TopNav variant={variant} isAuthenticated />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
