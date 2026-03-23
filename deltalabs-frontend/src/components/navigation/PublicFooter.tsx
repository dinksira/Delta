import Link from "next/link";

import { Typography } from "@/components/theme";

/** Minimal public footer; legal links are placeholders until content exists. */
export function PublicFooter() {
  return (
    <footer className="mt-auto border-t border-border-default bg-surface-default">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <Typography variant="small" className="text-text-secondary">
          © {new Date().getFullYear()} Delta Labs. All rights reserved.
        </Typography>
        <nav className="flex flex-wrap gap-4" aria-label="Footer">
          <Link
            href="/privacy"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
