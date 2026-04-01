import { TopNav } from "@/components/navigation/TopNav";

/** Marketing/public site header with auth entry points. */
export function PublicHeader({
  isAuthenticated,
  profileInitials,
}: Readonly<{ isAuthenticated: boolean; profileInitials?: string }>) {
  return (
    <TopNav
      variant={isAuthenticated ? "landing_authorized" : "landing_unauthorized"}
      isAuthenticated={isAuthenticated}
      profileInitials={profileInitials}
    />
  );
}
