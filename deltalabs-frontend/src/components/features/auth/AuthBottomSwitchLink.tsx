import Link from "next/link";

import { Typography } from "@/components/theme";

type AuthBottomSwitchLinkProps = Readonly<{
  mode: "to_signup" | "to_signin";
  href?: string;
}>;

export function AuthBottomSwitchLink({ mode, href }: AuthBottomSwitchLinkProps) {
  const isToSignup = mode === "to_signup";
  const targetHref = href ?? (isToSignup ? "/signup" : "/login");
  const prefix = isToSignup ? "Not Registered Yet?" : "Already Registered ?";
  const action = isToSignup ? "Create an account" : "Sign in";

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
