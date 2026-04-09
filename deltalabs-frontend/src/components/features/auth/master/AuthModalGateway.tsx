"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { LoginPageView } from "@/modules/Auth/views/LoginPageView";
import { RecoverPageView } from "@/modules/Auth/views/RecoverPageView";
import { SignupPageView } from "@/modules/Auth/views/SignupPageView";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type AuthMode = "login" | "signup" | "recover";

type AuthModalGatewayProps = Readonly<{
  enabled: boolean;
}>;

/** ################################ /TYPES ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function isAuthMode(value: string | null): value is AuthMode {
  return value === "login" || value === "signup" || value === "recover";
}

function setAuthModeInQuery(pathname: string, searchParams: URLSearchParams, mode?: AuthMode): string {
  const next = new URLSearchParams(searchParams.toString());
  if (mode) {
    next.set("auth", mode);
  } else {
    next.delete("auth");
  }
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/** ################################ /HELPERS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AuthModalGateway({ enabled }: AuthModalGatewayProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const mode = useMemo<AuthMode | null>(() => {
    const raw = searchParams.get("auth");
    return isAuthMode(raw) ? raw : null;
  }, [searchParams]);

  useEffect(() => {
    if (!enabled && mode) {
      router.replace(setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString())));
    }
  }, [enabled, mode, pathname, router, searchParams]);

  useEffect(() => {
    if (!enabled || !mode) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        router.replace(setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString())));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled, mode, pathname, router, searchParams]);

  if (!enabled || !mode) {
    return null;
  }

  const closeHref = setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString()));
  const loginHref = setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString()), "login");
  const signupHref = setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString()), "signup");
  const recoverHref = setAuthModeInQuery(pathname, new URLSearchParams(searchParams.toString()), "recover");

  return (
    <div className="fixed inset-0 z-[1300] bg-slate-900/40 p-4 backdrop-blur-[1px] sm:p-8">
      <div className="mx-auto flex h-full w-full max-w-4xl items-start justify-center overflow-y-auto">
        {mode === "login" ? (
          <LoginPageView
            showBack={false}
            closeHref={closeHref}
            forgotHref={recoverHref}
            switchSignupHref={signupHref}
            redirectAfterLoginHref={closeHref}
          />
        ) : null}
        {mode === "signup" ? (
          <SignupPageView
            showBack
            backHref={loginHref}
            closeHref={closeHref}
            switchSigninHref={loginHref}
            redirectAfterSignupHref={closeHref}
          />
        ) : null}
        {mode === "recover" ? (
          <RecoverPageView
            showBack
            backHref={loginHref}
            closeHref={closeHref}
            switchSignupHref={signupHref}
          />
        ) : null}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
