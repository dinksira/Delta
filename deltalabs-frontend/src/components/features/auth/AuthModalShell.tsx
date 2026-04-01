import type { ReactNode } from "react";
import Link from "next/link";

import { Typography } from "@/components/theme";

type AuthModalShellProps = Readonly<{
  title: string;
  subtitle: string;
  showBack?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  closeHref?: string;
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}>;

export function AuthModalShell({
  title,
  subtitle,
  showBack = true,
  backHref = "/",
  onBackClick,
  closeHref = "/",
  banner,
  children,
  footer,
}: AuthModalShellProps) {
  return (
    <div className="flex flex-1 items-start justify-center px-2 py-2 sm:px-4 sm:py-4">
      <section className="w-full max-w-3xl rounded-2xl border border-auth-modal-border bg-auth-modal-surface shadow-auth-modal">
        <header>
          {banner}
          <div className="flex items-center justify-between px-7 py-5">
            {showBack ? (
              onBackClick ? (
                <button
                  type="button"
                  onClick={onBackClick}
                  aria-label="Back"
                  className="rounded-md p-1 text-[#0f5169] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <span aria-hidden className="text-2xl leading-none">←</span>
                </button>
              ) : (
                <Link
                  href={backHref}
                  aria-label="Back"
                  className="rounded-md p-1 text-[#0f5169] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  <span aria-hidden className="text-2xl leading-none">←</span>
                </Link>
              )
            ) : (
              <span />
            )}
            <Link
              href={closeHref}
              aria-label="Close"
              className="rounded-md p-1 text-[#0f5169] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              <span aria-hidden className="text-3xl leading-none">&times;</span>
            </Link>
          </div>
        </header>

        <div className="px-6 pb-10 pt-2 sm:px-16">
          <div className="mb-8 text-center">
            <Typography as="h1" variant="h1" className="text-[2.85rem] font-semibold tracking-tight text-text-primary sm:text-[3rem]">
              {title}
            </Typography>
            <Typography variant="body" className="mt-2 text-lg text-text-secondary sm:text-xl">
              {subtitle}
            </Typography>
          </div>
          {children}
          {footer ? <div className="mt-8">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
