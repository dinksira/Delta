import { Suspense } from "react";

import { CustomFeedView } from "@/modules/Feed/views/CustomFeedView";

export default function CustomFeedPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-text-secondary">Loading…</div>}>
      <CustomFeedView />
    </Suspense>
  );
}
