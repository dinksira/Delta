"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const STROKE = 1.65;

/** Square outline with inner bar — click switches between landing and features (design spec). */
export function LandingFeaturesIconSwitch() {
  const pathname = usePathname();
  const onFeatures = pathname.startsWith("/features");
  const href = onFeatures ? "/" : "/features";
  const label = onFeatures ? "Go to landing" : "Go to features";

  return (
    <Link
      href={href}
      prefetch
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      aria-label={label}
    >
      <svg
        className="size-8"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden
      >
        <rect
          x={3.75}
          y={3.75}
          width={16.5}
          height={16.5}
          rx={1.5}
          stroke="currentColor"
          strokeWidth={STROKE}
        />
        {onFeatures ? (
          <rect x={14.25} y={6.25} width={4.25} height={11.5} rx={0.5} fill="currentColor" />
        ) : (
          <rect x={5.5} y={6.25} width={4.25} height={11.5} rx={0.5} fill="currentColor" />
        )}
      </svg>
    </Link>
  );
}
