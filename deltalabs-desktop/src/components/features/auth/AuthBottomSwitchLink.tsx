"use client";

import Link from "next/link";

import { Typography } from "@/components/theme";
import { useAuthMessages } from "@/i18n/LocaleContext";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type AuthBottomSwitchLinkProps = Readonly<{
  mode: "to_signup" | "to_signin";
  href?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AuthBottomSwitchLink({ mode, href }: AuthBottomSwitchLinkProps) {
  const a = useAuthMessages();
  const isToSignup = mode === "to_signup";
  const targetHref = href ?? (isToSignup ? "/signup" : "/login");
  const prefix = isToSignup ? a.bottomLink.notRegistered : a.bottomLink.alreadyRegistered;
  const action = isToSignup ? a.bottomLink.createAccount : a.bottomLink.signIn;

  return (
    <div className="text-center">
      <Typography variant="small" className="text-sm text-text-secondary">
        {prefix}{" "}
        <Link
          href={targetHref}
          className="font-bold text-primary-600 hover:text-primary-700 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
        >
          {action}
        </Link>
      </Typography>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
