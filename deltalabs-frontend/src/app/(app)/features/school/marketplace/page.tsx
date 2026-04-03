import Link from "next/link";
import { redirect } from "next/navigation";

import { SchoolBodySearch } from "@/modules/School/components/SchoolBodySearch";
import { SchoolEntityCard } from "@/modules/School/components/SchoolEntityCard";
import { SchoolWorkspaceHeader } from "@/modules/School/components/SchoolWorkspaceHeader";
import { cx } from "@/components/theme/utils";

const VIEWS = ["community", "bids", "listings"] as const;
type MarketplaceView = (typeof VIEWS)[number];

function isView(value: string | undefined): value is MarketplaceView {
  return value !== undefined && (VIEWS as readonly string[]).includes(value);
}

const tabs: { label: string; view: MarketplaceView }[] = [
  { label: "Community", view: "community" },
  { label: "My Bids", view: "bids" },
  { label: "My listings", view: "listings" },
];

type PageProps = Readonly<{ searchParams: Promise<{ view?: string }> }>;

/** School Buy/Sell — marketplace tabs + cards (design shell). */
export default async function SchoolMarketplacePage({ searchParams }: PageProps) {
  const p = await searchParams;
  const view = p.view;
  if (!isView(view)) {
    redirect("/features/school/marketplace?view=community");
  }

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
