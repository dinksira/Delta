import { Suspense } from "react";
import { AudioDetailView } from "@/modules/Feed/views/AudioDetailView";

export function generateStaticParams() {
  return [{ id: "default" }];
}

export default function AudioDetailPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-text-secondary text-sm">Loading details…</div>}>
      <AudioDetailView />
    </Suspense>
  );
}
