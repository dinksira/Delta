/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { redirect } from "next/navigation";

import { SchoolOffersView } from "@/modules/School/views/SchoolOffersView";
import { isOfferStatus } from "@/modules/School/types/offers";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type PageProps = Readonly<{ searchParams: Promise<{ status?: string }> }>;

/** Offers — validates `status` query then delegates to `SchoolOffersView`. */
export default async function SchoolOffersPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const status = p.status;
  if (!isOfferStatus(status)) {
    redirect("/features/school/offers?status=requested");
  }

  return <SchoolOffersView status={status} />;
}
/** ################################ /COMPONENT ############################# */
