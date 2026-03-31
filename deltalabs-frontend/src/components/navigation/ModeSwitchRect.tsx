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
      className="inline-flex items-center rounded-full border border-border-default bg-surface-muted p-1"
      aria-label="Screen mode switch"
    >
      <Link
        href="/"
        className={[
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isLandingActive
            ? "bg-surface-default text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        Landing
      </Link>
      <Link
        href="/features"
        className={[
          "rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
          isFeaturesActive
            ? "bg-surface-default text-text-primary shadow-sm"
            : "text-text-secondary hover:text-text-primary",
        ].join(" ")}
      >
        Features
      </Link>
    </div>
  );
}
