"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FeaturesPageView } from "@/modules/Features/views/FeaturesPageView";
import { featuresPathWithHiddenNotice } from "@/modules/Features/featureHiddenNotice";
import { useFeaturesLayoutAccess } from "@/modules/Features/hooks/useFeaturesLayoutAccess";

function ClientRedirector() {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const { isFeatureHidden, isLayoutReady } = useFeaturesLayoutAccess();
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (!tab || !isLayoutReady) return;
    if (isFeatureHidden(tab)) {
      router.replace(featuresPathWithHiddenNotice(tab));
      return;
    }
    if (tab === "school") {
      router.replace("/features/school");
    }
    if (tab === "course") {
      router.replace("/features/course");
    }
  }, [isFeatureHidden, isLayoutReady, router, tab]);

  return null;
}

export default function FeaturesPage() {
  return (
    <Suspense fallback={null}>
      <ClientRedirector />
      <FeaturesPageView />
    </Suspense>
  );
}
