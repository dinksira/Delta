/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { redirect } from "next/navigation";

import { SchoolOffersView } from "@/modules/School/views/SchoolOffersView";
import { isOfferStatus, isOfferView } from "@/modules/School/types/offers";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type PageProps = Readonly<{ searchParams: Promise<{ status?: string; view?: string }> }>;

/** Offers — validates `status` query then delegates to `SchoolOffersView`. */
export default async function SchoolOffersPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const status = p.status;
  const view = p.view;
  if (!isOfferStatus(status) || !isOfferView(view)) {
    redirect("/features/school/offers?status=requested&view=received");
  }

  return <SchoolOffersView status={status} view={view} />;
}
/** ################################ /COMPONENT ############################# */
