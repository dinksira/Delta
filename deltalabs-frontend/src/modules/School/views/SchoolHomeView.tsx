/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useQuery } from "@tanstack/react-query";

import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolStatStrip } from "@/components/features/school/master/SchoolStatStrip";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { fetchMyOrgs, fetchSchoolModuleStatus } from "@/modules/School/api";

/** ################################ /IMPORT ############################# */
/** ################################ COMPONENT ############################# */
/** My School — overview, stats, search, and school cards (design shell). */
export function SchoolHomeView() {
  const { data: orgData } = useQuery({
    queryKey: ["orgs", "me"],
    queryFn: fetchMyOrgs,
    staleTime: 60_000,
  });
  const { data: schoolStatus } = useQuery({
    queryKey: ["school", "module-status"],
    queryFn: fetchSchoolModuleStatus,
    staleTime: 60_000,
  });
  const orgItems = orgData?.items ?? [];

  return (
    <>
      <SchoolWorkspaceHeader title="My School" />
      <div className="space-y-6 py-6">
        <SchoolStatStrip />
        {schoolStatus ? (
          <p className="text-sm text-text-secondary">
            Backend module status:{" "}
            <span className="font-semibold text-text-primary">
              {(schoolStatus as { status?: string }).status ?? "connected"}
            </span>
          </p>
        ) : null}
        <SchoolBodySearch id="school-home-search" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orgItems.length > 0 ? (
            orgItems.map((org) => (
              <SchoolEntityCard
                key={org.id}
                name={org.name}
                location={`Org: ${org.slug}`}
                ctaVariant="portal"
              />
            ))
          ) : (
            <>
              <SchoolEntityCard ctaVariant="portal" />
              <SchoolEntityCard
                name="Lincoln High School"
                location="Portland, USA"
                ctaVariant="portal"
              />
              <SchoolEntityCard
                name="Saint Joseph School"
                location="Nairobi, Kenya"
                ctaVariant="portal"
              />
            </>
          )}
        </div>
      </div>
    </>
  );
}
/** ################################ /COMPONENT ############################# */
