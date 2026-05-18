"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";
import Link from "next/link";

import { NavLanguageControl } from "@/components/navigation/NavLanguageControl";

/** ################################ /IMPORT ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function IconClose() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconBack() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0">
      <path
        d="M15 18 9 12l6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const headerControlClass =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-black/[0.04] hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-auth-modal-surface dark:hover:bg-white/[0.06]";

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type AuthModalShellProps = Readonly<{
  title: string;
  subtitle: string;
  showBack?: boolean;
  backHref?: string;
  onBackClick?: () => void;
  closeHref?: string;
  /** Server / async response only — shown below the top control row. */
  banner?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
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
  const titleBlock = (
    <div className="mb-4 text-center">
      <h1 className="text-2xl font-bold leading-tight tracking-tight text-text-primary">{title}</h1>
      <p className="mt-1.5 text-sm font-normal text-text-secondary">{subtitle}</p>
    </div>
  );

  return (
    <div className="flex w-full flex-1 items-start justify-center px-3 py-2 sm:px-4 sm:py-3">
      <section className="w-full max-w-[var(--dl-auth-modal-max-width)] overflow-hidden rounded-lg border border-auth-modal-border bg-auth-modal-surface shadow-auth-modal">
        <header
          className={[
            "px-4 py-3 sm:px-6",
            banner ? "border-b border-border-subtle bg-surface-muted/60" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="flex items-center gap-2">
            <div className="flex w-9 shrink-0 justify-start">
              {showBack ? (
                onBackClick ? (
                  <button type="button" onClick={onBackClick} aria-label="Back" className={headerControlClass}>
                    <IconBack />
                  </button>
                ) : (
                  <Link href={backHref} aria-label="Back" className={headerControlClass}>
                    <IconBack />
                  </Link>
                )
              ) : (
                <span className="inline-block h-9 w-9 shrink-0" aria-hidden />
              )}
            </div>
            <div className="min-w-0 flex-1" />
            <div className="flex shrink-0 items-center gap-1 sm:gap-2">
              <NavLanguageControl />
              <Link href={closeHref} aria-label="Close" className={headerControlClass}>
                <IconClose />
              </Link>
            </div>
          </div>
          {banner ? <div className="mt-3">{banner}</div> : null}
        </header>

        <div className="px-6 pb-8 pt-5 sm:px-8">
          {titleBlock}
          {children}
          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>
      </section>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
