"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { FeaturesPageView } from "@/modules/Features/views/FeaturesPageView";

function ClientRedirector() {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  
  useEffect(() => {
    if (searchParams.get("tab") === "school") {
      router.replace("/features/school");
    }
  }, [searchParams, router]);

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
