"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type TopNavAuthActionsProps = Readonly<{
  isAuthenticated: boolean;
}>;

export function TopNavAuthActions({ isAuthenticated }: TopNavAuthActionsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = new URLSearchParams(searchParams.toString());
  next.set("auth", "login");
  const loginHref = `${pathname}?${next.toString()}`;
  next.set("auth", "signup");
  const signupHref = `${pathname}?${next.toString()}`;

  const pillClass =
    "inline-flex h-10 min-w-[5.5rem] items-center justify-center rounded-full border border-white bg-transparent px-5 text-[15px] font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:min-w-[5.75rem] sm:px-6 sm:text-base";

  if (isAuthenticated) {
    return (
      <Link href="/dashboard" className={pillClass}>
        Dashboard
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link href={loginHref} className={pillClass}>
        Login
      </Link>
      <Link href={signupHref} className={pillClass}>
        Sign up
      </Link>
    </div>
  );
}
