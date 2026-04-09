/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";

import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { cx } from "@/components/theme/utils";
import type { MarketplaceView } from "@/modules/School/types/marketplace";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const tabs: { label: string; view: MarketplaceView }[] = [
  { label: "Community", view: "community" },
  { label: "My Bids", view: "bids" },
  { label: "My listings", view: "listings" },
];

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolMarketplaceViewProps = Readonly<{
  view: MarketplaceView;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** School Buy/Sell — marketplace tabs + cards (design shell). */
export function SchoolMarketplaceView({ view }: SchoolMarketplaceViewProps) {
  return (
    <>
      <SchoolWorkspaceHeader title="School Buy/Sell" />
      <div className="bg-surface-canvas py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-2" aria-label="Marketplace sections">
            {tabs.map((tab) => {
              const href = `/features/school/marketplace?view=${tab.view}`;
              const active = tab.view === view;
              return (
                <Link
                  key={tab.view}
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
          <SchoolBodySearch id="school-marketplace-search" />
        </div>
      </div>
      <div className="py-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          <SchoolEntityCard ctaVariant="marketplace" />
        </div>
      </div>
    </>
  );
}
/** ################################ /COMPONENT ############################# */
