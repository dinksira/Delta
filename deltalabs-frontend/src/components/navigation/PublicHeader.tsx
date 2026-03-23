import Link from "next/link";

import { ThemeToggle } from "@/components/navigation/ThemeToggle";
import { ButtonLink, Typography } from "@/components/theme";

/** Marketing/public site header with auth entry points. */
export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border-default bg-surface-default/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 rounded-md">
          <Typography as="span" variant="label" className="text-primary-600">
            Delta Labs
          </Typography>
        </Link>
        <nav className="hidden items-center gap-6 sm:flex" aria-label="Primary">
          <Link
            href="/#features"
            className="text-sm font-medium text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
          >
            Features
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle />
          <ButtonLink href="/login" variant="secondary" size="sm">
            Log in
          </ButtonLink>
          <ButtonLink href="/signup" variant="primary" size="sm">
            Sign up
          </ButtonLink>
        </div>
      </div>
    </header>
  );
}
