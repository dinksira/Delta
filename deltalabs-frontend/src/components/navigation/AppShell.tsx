import Link from "next/link";
import type { ReactNode } from "react";

import { ModeSwitchRect } from "@/components/navigation/ModeSwitchRect";
import { Typography } from "@/components/theme";
import { ThemeToggle } from "@/components/navigation/ThemeToggle";

/** Authenticated app chrome: top bar and main content region. */
export function AppShell({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-full flex-col bg-surface-canvas">
      <header className="border-b border-border-default bg-surface-default">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            href="/dashboard"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded-md"
          >
            <Typography as="span" variant="label" className="text-primary-600">
              Delta Labs
            </Typography>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6" aria-label="App">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
            >
              Dashboard
            </Link>
            <Link
              href="/enrolled-courses"
              className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
            >
              Enrolled courses
            </Link>
          </nav>
          <div className="flex items-center gap-2 sm:gap-3">
            <ModeSwitchRect isAuthenticated />
            <ThemeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
