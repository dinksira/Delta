import { TopNav } from "@/components/navigation/TopNav";

/** Marketing/public site header with auth entry points. */
export function PublicHeader({ isAuthenticated }: Readonly<{ isAuthenticated: boolean }>) {
  return <TopNav variant={isAuthenticated ? "landing_authorized" : "landing_unauthorized"} isAuthenticated={isAuthenticated} />;
}
