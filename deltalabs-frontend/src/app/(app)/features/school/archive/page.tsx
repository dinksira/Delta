import { SchoolBodySearch } from "@/modules/School/components/SchoolBodySearch";
import { SchoolEntityCard } from "@/modules/School/components/SchoolEntityCard";
import { SchoolWorkspaceHeader } from "@/modules/School/components/SchoolWorkspaceHeader";

/** Archived schools — card grid (design shell). */
export default function SchoolArchivePage() {
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
