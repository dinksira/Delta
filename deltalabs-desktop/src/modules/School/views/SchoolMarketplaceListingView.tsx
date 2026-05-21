"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { Card, Typography } from "@/components/theme";
import { fetchGlobalSchoolMarketplaceItem } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useAuthSession } from "@/contexts/AuthSession_Context";

type SchoolMarketplaceListingViewProps = Readonly<{
  listingId: string;
}>;

export function SchoolMarketplaceListingView({ listingId }: SchoolMarketplaceListingViewProps) {
  const { isReady, isAuthenticated } = useAuthSession();
  const enabled = isReady && isAuthenticated && listingId.trim().length > 0;

  const { data, isLoading } = useQuery({
    queryKey: schoolQueryKeys.marketplace("global", "community", { q: listingId }),
    queryFn: () => fetchGlobalSchoolMarketplaceItem(listingId),
    enabled,
    retry: false,
    staleTime: 30_000,
  });

  return (
    <>
      <SchoolWorkspaceHeader title="Listing details" />
      <div className="py-6">
        <Link href="/features/school/marketplace?view=community" className="text-sm text-primary-600 hover:underline">
          Back to marketplace
        </Link>
        <Card className="mt-4 space-y-3 p-5">
          {isLoading ? (
            <Typography className="text-sm text-text-secondary">Loading listing...</Typography>
          ) : data ? (
            <>
              <Typography as="h2" className="text-xl font-semibold text-text-primary">
                {data.title}
              </Typography>
              <Typography className="text-sm text-text-secondary">{data.description}</Typography>
              <Typography className="text-sm text-text-secondary">
                {data.schoolName} • {data.currency} {data.price}
              </Typography>
              <Typography className="text-sm text-text-secondary">Status: {data.status.replace("_", " ")}</Typography>
            </>
          ) : (
            <Typography className="text-sm text-text-secondary">Listing not found.</Typography>
          )}
        </Card>
      </div>
    </>
  );
}
