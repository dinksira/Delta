/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Authenticated dashboard placeholder until module dashboards are composed here. */
export function DashboardPageView() {
  return (
    <div className="flex flex-col gap-4">
      <Typography as="h1" variant="h2">
        Dashboard
      </Typography>
      <Typography variant="small" className="text-text-secondary">
        Welcome to your workspace. Module-specific dashboards will appear here.
      </Typography>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
