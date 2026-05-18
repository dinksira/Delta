/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Suspense } from "react";

import { LandingPageView } from "@/modules/Feed/views/LandingPageView";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export default function PublicLandingPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-text-secondary">Loading…</div>}>
      <LandingPageView />
    </Suspense>
  );
}
/** ################################ /COMPONENT ############################# */
