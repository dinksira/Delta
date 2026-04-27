/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { TopNav } from "@/components/navigation/TopNav";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** Marketing/public site header with auth entry points. */
export function PublicHeader({
  isAuthenticated,
  profileInitials,
  sessionPending,
}: Readonly<{
  isAuthenticated: boolean;
  profileInitials?: string;
  sessionPending?: boolean;
}>) {
  const variant = sessionPending
    ? "landing_pending"
    : isAuthenticated
      ? "landing_authorized"
      : "landing_unauthorized";

  return (
    <TopNav variant={variant} isAuthenticated={isAuthenticated} profileInitials={profileInitials} />
  );
}
/** ################################ /COMPONENT ############################# */
