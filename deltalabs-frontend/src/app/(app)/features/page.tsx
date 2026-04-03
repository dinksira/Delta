import { Suspense } from "react";
import { redirect } from "next/navigation";

import { FeaturesPageView } from "@/modules/Features/views/FeaturesPageView";

type PageProps = Readonly<{ searchParams: Promise<{ tab?: string }> }>;

export default async function FeaturesPage({ searchParams }: PageProps) {
  const p = await searchParams;
  if (p.tab === "school") {
    redirect("/features/school");
  }

  return (
    <Suspense fallback={null}>
      <FeaturesPageView />
    </Suspense>
  );
}
