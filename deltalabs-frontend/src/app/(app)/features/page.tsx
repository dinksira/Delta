import { Suspense } from "react";

import { FeaturesPageView } from "@/modules/Feed/views/FeaturesPageView";

export default function FeaturesPage() {
  return (
    <Suspense fallback={null}>
      <FeaturesPageView />
    </Suspense>
  );
}
