import Link from "next/link";
import { redirect } from "next/navigation";

import { SchoolBodySearch } from "@/modules/School/components/SchoolBodySearch";
import { SchoolOffersTable } from "@/modules/School/components/SchoolOffersTable";
import { SchoolWorkspaceHeader } from "@/modules/School/components/SchoolWorkspaceHeader";
import { cx } from "@/components/theme/utils";

const OFFER_STATUSES = ["requested", "approved", "amendment", "rejected"] as const;

type OfferStatus = (typeof OFFER_STATUSES)[number];

function isOfferStatus(value: string | undefined): value is OfferStatus {
  return value !== undefined && (OFFER_STATUSES as readonly string[]).includes(value);
}

const tabs: { label: string; status: OfferStatus }[] = [
  { label: "Requested", status: "requested" },
  { label: "Approved", status: "approved" },
  { label: "Amendment", status: "amendment" },
  { label: "Rejected", status: "rejected" },
];

type PageProps = Readonly<{ searchParams: Promise<{ status?: string }> }>;

/** My School / Offers — status tabs + queue table (design shell). */
export default async function SchoolOffersPage({ searchParams }: PageProps) {
  const p = await searchParams;
  const status = p.status;
  if (!isOfferStatus(status)) {
    redirect("/features/school/offers?status=requested");
  }

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
