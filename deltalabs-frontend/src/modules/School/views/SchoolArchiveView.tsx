/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** Archived schools — card grid (design shell). */
export function SchoolArchiveView() {
  return (
    <>
      <SchoolWorkspaceHeader title="Archived" />
      <div className="flex flex-col gap-4 bg-surface-canvas py-4 sm:flex-row sm:items-center sm:justify-end">
        <SchoolBodySearch id="school-archive-search" />
      </div>
      <div className="py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SchoolEntityCard ctaVariant="archive" />
          <SchoolEntityCard name="Heritage Academy" location="Cape Town, South Africa" ctaVariant="archive" />
        </div>
      </div>
    </>
  );
}
/** ################################ /COMPONENT ############################# */
