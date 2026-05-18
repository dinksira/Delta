"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { SchoolOffersView } from "@/modules/School/views/SchoolOffersView";
import { isOfferStatus, isOfferView } from "@/modules/School/types/offers";

function SchoolOffersClientPage() {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const status = searchParams.get("status");
  const view = searchParams.get("view");

  useEffect(() => {
    if (!isOfferStatus(status) || !isOfferView(view)) {
      router.replace("/features/school/offers?status=requested&view=received");
    }
  }, [status, view, router]);

  if (!isOfferStatus(status) || !isOfferView(view)) {
    return null;
  }

  return <SchoolOffersView status={status} view={view} />;
}

export default function SchoolOffersPage() {
  return (
    <Suspense fallback={null}>
      <SchoolOffersClientPage />
    </Suspense>
  );
}
