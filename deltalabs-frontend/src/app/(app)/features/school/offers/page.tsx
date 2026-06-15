"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import {
  getWorkspaceTabId,
  preserveWorkspaceTabId,
} from "@/modules/Features/featureWorkspaceTabs";
import { SchoolOffersView } from "@/modules/School/views/SchoolOffersView";
import { isOfferStatus, isOfferView } from "@/modules/School/types/offers";

function SchoolOffersClientPage() {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const status = searchParams.get("status");
  const view = searchParams.get("view");

  useEffect(() => {
    if (!isOfferStatus(status) || !isOfferView(view)) {
      const destination = preserveWorkspaceTabId(
        "/features/school/offers?status=requested&view=received",
        getWorkspaceTabId(searchParams),
      );
      router.replace(destination);
    }
  }, [status, view, router, searchParams]);

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
