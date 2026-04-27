/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { redirect } from "next/navigation";

import { SchoolMarketplaceView } from "@/modules/School/views/SchoolMarketplaceView";
import { isMarketplaceView } from "@/modules/School/types/marketplace";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type PageProps = Readonly<{ searchParams: Promise<{ view?: string }> }>;

/** School Buy/Sell — validates `view` query then delegates to `SchoolMarketplaceView`. */
export default async function SchoolMarketplacePage({ searchParams }: PageProps) {
  const p = await searchParams;
  const view = p.view;
  if (!isMarketplaceView(view)) {
    redirect("/features/school/marketplace?view=community");
  }

  return <SchoolMarketplaceView view={view} />;
}
/** ################################ /COMPONENT ############################# */
