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

  if (isAuthenticated) {
    return (
      <Link
        href="/dashboard"
        className="inline-flex h-9 items-center justify-center rounded-full border border-white/70 px-5 text-sm font-semibold text-white hover:bg-white/10"
      >
        Dashboard
      </Link>
    );
  }

  return (
    <>
      <Link
        href={loginHref}
        className="inline-flex h-9 items-center justify-center rounded-full border border-white/70 px-5 text-sm font-semibold text-white hover:bg-white/10"
      >
        Login
      </Link>
      <Link
        href={signupHref}
        className="inline-flex h-9 items-center justify-center rounded-full border border-white/70 px-5 text-sm font-semibold text-white hover:bg-white/10"
      >
        Sign up
      </Link>
    </>
  );
}
