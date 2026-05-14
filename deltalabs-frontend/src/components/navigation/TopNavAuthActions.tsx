"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { ButtonLink } from "@/components/theme";
import { NavLanguageControl } from "@/components/navigation/NavLanguageControl";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuthMessages } from "@/i18n/LocaleContext";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type TopNavAuthActionsProps = Readonly<{
  isAuthenticated: boolean;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function TopNavAuthActions({ isAuthenticated }: TopNavAuthActionsProps) {
  const a = useAuthMessages();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const next = new URLSearchParams(searchParams.toString());
  next.set("auth", "login");
  const loginHref = `${pathname}?${next.toString()}`;
  next.set("auth", "signup");
  const signupHref = `${pathname}?${next.toString()}`;

  if (isAuthenticated) {
    return (
      <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
        <NavLanguageControl tone="onPrimary" />
        <ButtonLink variant="outlineInverse" size="md" href="/dashboard">
          {a.nav.dashboard}
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
      <NavLanguageControl tone="onPrimary" />
      <ButtonLink variant="outlineInverse" size="md" href={loginHref}>
        {a.nav.login}
      </ButtonLink>
      <ButtonLink variant="outlineInverse" size="md" href={signupHref}>
        {a.nav.signup}
      </ButtonLink>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
