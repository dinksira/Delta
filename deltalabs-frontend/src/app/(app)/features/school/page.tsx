import { SchoolBodySearch } from "@/modules/School/components/SchoolBodySearch";
import { SchoolEntityCard } from "@/modules/School/components/SchoolEntityCard";
import { SchoolStatStrip } from "@/modules/School/components/SchoolStatStrip";
import { SchoolWorkspaceHeader } from "@/modules/School/components/SchoolWorkspaceHeader";

/** My School — overview, stats, search, and school cards (design shell). */
export default function SchoolHomePage() {
  return (
    <>
      <SchoolWorkspaceHeader title="My School" />
      <div className="space-y-6 py-6">
        <SchoolStatStrip />
        <SchoolBodySearch id="school-home-search" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SchoolEntityCard ctaVariant="portal" />
          <SchoolEntityCard name="Lincoln High School" location="Portland, USA" ctaVariant="portal" />
          <SchoolEntityCard name="Saint Joseph School" location="Nairobi, Kenya" ctaVariant="portal" />
        </div>
      </div>
    </>
  );
}
