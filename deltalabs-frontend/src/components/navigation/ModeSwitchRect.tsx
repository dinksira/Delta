"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ModeSwitchRectProps = Readonly<{
  isAuthenticated: boolean;
}>;

export function ModeSwitchRect({ isAuthenticated }: ModeSwitchRectProps) {
  const pathname = usePathname();

  if (!isAuthenticated) {
    return null;
  }

  const isFeaturesActive = pathname.startsWith("/features");
  const isLandingActive = !isFeaturesActive;

  return (
    <div
      className="inline-flex items-center rounded-full border border-switch-mode-track-border bg-switch-mode-track-bg p-1"
      aria-label="Screen mode switch"
    >
      <Link
        href="/"
        className={[
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isLandingActive
            ? "bg-switch-mode-pill-active-bg text-switch-mode-pill-active-text shadow-sm"
            : "text-switch-mode-pill-inactive-text hover:text-switch-mode-pill-active-text",
        ].join(" ")}
      >
        Landing
      </Link>
      <Link
        href="/features"
        className={[
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isFeaturesActive
            ? "bg-switch-mode-pill-active-bg text-switch-mode-pill-active-text shadow-sm"
            : "text-switch-mode-pill-inactive-text hover:text-switch-mode-pill-active-text",
        ].join(" ")}
      >
        Features
      </Link>
    </div>
  );
}
