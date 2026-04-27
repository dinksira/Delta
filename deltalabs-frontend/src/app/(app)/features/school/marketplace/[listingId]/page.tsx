import { SchoolMarketplaceListingView } from "@/modules/School/views/SchoolMarketplaceListingView";

type PageProps = Readonly<{
  params: Promise<{ listingId: string }>;
}>;

export default async function SchoolMarketplaceListingPage({ params }: PageProps) {
  const { listingId } = await params;
  return <SchoolMarketplaceListingView listingId={listingId} />;
}
