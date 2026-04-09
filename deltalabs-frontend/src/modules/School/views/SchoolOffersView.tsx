/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";

import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolOffersTable } from "@/components/features/school/master/SchoolOffersTable";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { cx } from "@/components/theme/utils";
import type { OfferStatus } from "@/modules/School/types/offers";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const tabs: { label: string; status: OfferStatus }[] = [
  { label: "Requested", status: "requested" },
  { label: "Approved", status: "approved" },
  { label: "Amendment", status: "amendment" },
  { label: "Rejected", status: "rejected" },
];

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolOffersViewProps = Readonly<{
  status: OfferStatus;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Offers — status tabs, search, and queue table (design shell). */
export function SchoolOffersView({ status }: SchoolOffersViewProps) {
  const statusTabLabel = tabs.find((t) => t.status === status)?.label ?? "Requested";

  return (
    <>
      <SchoolWorkspaceHeader title="Offers" />
      <div className="bg-surface-canvas py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-2" aria-label="Offer status">
            {tabs.map((tab) => {
              const href = `/features/school/offers?status=${tab.status}`;
              const active = tab.status === status;
              return (
                <Link
                  key={tab.status}
                  href={href}
                  prefetch
                  className={cx(
                    "relative pb-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
                    active ? "text-text-primary" : "text-text-secondary hover:text-text-primary",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  {tab.label}
                  <span
                    className={cx(
                      "absolute bottom-0 left-0 right-0 h-0.5 rounded-full",
                      active ? "bg-primary-600" : "bg-transparent",
                    )}
                    aria-hidden
                  />
                </Link>
              );
            })}
          </nav>
          <SchoolBodySearch id="school-offers-search" />
        </div>
      </div>
      <div className="py-6">
        <SchoolOffersTable title={`${statusTabLabel} offers`} />
      </div>
    </>
  );
}
/** ################################ /COMPONENT ############################# */
