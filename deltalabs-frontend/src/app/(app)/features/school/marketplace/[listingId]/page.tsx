import { SchoolMarketplaceListingView } from "@/modules/School/views/SchoolMarketplaceListingView";

export function generateStaticParams() {
  return [{ listingId: "default" }];
}

type PageProps = Readonly<{
  params: Promise<{ listingId: string }>;
}>;

export default async function SchoolMarketplaceListingPage({ params }: PageProps) {
  const { listingId } = await params;
  return <SchoolMarketplaceListingView listingId={listingId} />;
}
