"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SchoolMarketplaceView } from "@/modules/School/views/SchoolMarketplaceView";
import { isMarketplaceView } from "@/modules/School/types/marketplace";

function SchoolMarketplaceClientPage() {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const view = searchParams.get("view");

  useEffect(() => {
    if (!isMarketplaceView(view)) {
      router.replace("/features/school/marketplace?view=community");
    }
  }, [view, router]);

  if (!isMarketplaceView(view)) {
    return null;
  }

  return <SchoolMarketplaceView view={view} />;
}

export default function SchoolMarketplacePage() {
  return (
    <Suspense fallback={null}>
      <SchoolMarketplaceClientPage />
    </Suspense>
  );
}
