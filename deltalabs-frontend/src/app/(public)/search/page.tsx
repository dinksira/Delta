import { Suspense } from "react";

import { SearchResultsView } from "@/modules/Search/views/SearchResultsView";

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-text-secondary">Loading search…</div>}>
      <SearchResultsView />
    </Suspense>
  );
}
