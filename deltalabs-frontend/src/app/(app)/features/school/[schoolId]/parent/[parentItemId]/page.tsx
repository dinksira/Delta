import { Suspense } from "react";

import { SchoolParentDetailView } from "@/modules/School/views/SchoolParentDetailView";

export function generateStaticParams() {
  return [{ schoolId: "default", parentItemId: "default" }];
}

type ParentPageProps = Readonly<{
  params: Promise<{
    schoolId: string;
    parentItemId: string;
  }>;
}>;

export default async function SchoolParentPage({ params }: ParentPageProps) {
  const { schoolId, parentItemId } = await params;
  return (
    <Suspense fallback={<div className="px-2 py-8 text-sm text-text-secondary md:px-3">Loading parents…</div>}>
      <SchoolParentDetailView schoolId={schoolId} parentItemId={parentItemId} />
    </Suspense>
  );
}
