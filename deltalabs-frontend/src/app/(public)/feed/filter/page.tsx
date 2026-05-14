import { Suspense } from "react";

import { FilterResultsView } from "@/modules/Feed/views/FilterResultsView";

export default function FeedFilterResultsPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-text-secondary">Loading…</div>}>
      <FilterResultsView />
    </Suspense>
  );
}
