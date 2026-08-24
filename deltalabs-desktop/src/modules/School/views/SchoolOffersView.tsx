"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Inbox } from "lucide-react";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { SchoolBodySearch } from "@/components/features/school/SchoolBodySearch";
import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { SchoolAmendOfferModal } from "@/components/features/school/master/SchoolAmendOfferModal";
import { SchoolOfferDetailsDrawer } from "@/components/features/school/master/SchoolOfferDetailsDrawer";
import { SchoolOffersTable } from "@/components/features/school/master/SchoolOffersTable";
import { SchoolStatePanel } from "@/components/features/school/master/SchoolStatePanel";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { useWorkspaceTabHref } from "@/modules/Features/hooks/useWorkspaceTabHref";
import {
  getWorkspaceTabId,
  preserveWorkspaceTabId,
} from "@/modules/Features/featureWorkspaceTabs";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { cx } from "@/components/theme/utils";
import {
  fetchSchoolOffers,
  shortlistSchoolOffer,
  unshortlistSchoolOffer,
  updateSchoolOfferStatus,
  type OfferDto,
  type OfferView,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
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
  view: OfferView;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Offers — status tabs, search, and queue table (design shell). */
export function SchoolOffersView({ status, view }: SchoolOffersViewProps) {
  const { isReady, isAuthenticated, session } = useAuthSession();
  const searchParams = useSearchParams();
  const workspaceTabId = getWorkspaceTabId(searchParams);
  const addSchoolHref = useWorkspaceTabHref("/features/school/create");
  const offersHref = (nextStatus: OfferStatus, nextView: OfferView) =>
    preserveWorkspaceTabId(
      `/features/school/offers?status=${nextStatus}&view=${nextView}`,
      workspaceTabId,
    );
  const enabled = isReady && isAuthenticated;
  const queryClient = useQueryClient();
  const { activeOrgId } = useSchoolActiveOrgId();
  const [selectedOffer, setSelectedOffer] = useState<OfferDto | null>(null);
  const [confirmAction, setConfirmAction] = useState<
    | { kind: "approve" | "reject"; offer: OfferDto }
    | null
  >(null);
  const [amendOffer, setAmendOffer] = useState<OfferDto | null>(null);
  const {
    data: offersData,
    error: offersError,
    isPending: offersPending,
  } = useQuery({
    queryKey: schoolQueryKeys.offers("all", status, view),
    queryFn: () => fetchSchoolOffers(status, view),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  const updateOfferMutation = useMutation({
    mutationFn: async ({
      offerId,
      nextStatus,
      orgId,
      amendmentData,
    }: {
      offerId: string;
      nextStatus: OfferStatus;
      orgId: string;
      amendmentData?: {
        ownership_percentage?: number;
        share_accesses?: { access_name: string; status: "can_view" | "can_edit" | "can_manage" }[];
        offered_price?: number;
        offered_currency?: string;
        note?: string | null;
      };
    }) => {
      return updateSchoolOfferStatus(orgId, offerId, nextStatus, amendmentData);
    },
    onSuccess: async () => {
      for (const s of ["requested", "approved", "amendment", "rejected"] as const) {
        for (const v of ["received", "sent"] as const) {
          await queryClient.invalidateQueries({
            queryKey: schoolQueryKeys.offers("all", s, v),
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.mySchools() });
      setConfirmAction(null);
      setAmendOffer(null);
      setSelectedOffer(null);
    },
  });
  const shortlistOfferMutation = useMutation({
    mutationFn: async ({ offerId, orgId }: { offerId: string; orgId: string }) =>
      shortlistSchoolOffer(orgId, offerId),
    onSuccess: async () => {
      for (const s of ["requested", "approved", "amendment", "rejected"] as const) {
        for (const v of ["received", "sent"] as const) {
          await queryClient.invalidateQueries({
            queryKey: schoolQueryKeys.offers("all", s, v),
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.mySchools() });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "bids") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "listings") });
    },
  });
  const unshortlistOfferMutation = useMutation({
    mutationFn: async ({ offerId, orgId }: { offerId: string; orgId: string }) =>
      unshortlistSchoolOffer(orgId, offerId),
    onSuccess: async () => {
      for (const s of ["requested", "approved", "amendment", "rejected"] as const) {
        for (const v of ["received", "sent"] as const) {
          await queryClient.invalidateQueries({
            queryKey: schoolQueryKeys.offers("all", s, v),
          });
        }
      }
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "bids") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", "listings") });
    },
  });

  const statusTabLabel = tabs.find((t) => t.status === status)?.label ?? "Requested";
  const rows = offersData?.items ?? [];

  const nextStatusForKind: Record<"approve" | "reject", OfferStatus> = {
    approve: "approved",
    reject: "rejected",
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;
    updateOfferMutation.mutate({
      offerId: confirmAction.offer.id,
      nextStatus: nextStatusForKind[confirmAction.kind],
      orgId: confirmAction.offer.orgId,
    });
  };

  const normalizedSessionEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const canRespondToOffer = (offer: OfferDto) => {
    if (!normalizedSessionEmail) return false;
    const turn = offer.negotiationTurn ?? "recipient";
    const expected =
      turn === "recipient"
        ? offer.recipientEmail?.trim().toLowerCase()
        : offer.senderEmail?.trim().toLowerCase();
    return expected === normalizedSessionEmail;
  };

  return (
    <>
      <SchoolWorkspaceHeader title="Offers" addSchoolHref={addSchoolHref} />
      <div className="bg-surface-canvas py-4">
        <p className="mb-3 text-sm text-text-secondary">
          Offers is the core negotiation module for partner ownership invites and direct offer exchanges. Marketplace bids
          are handled in Marketplace/Deal Room.
        </p>
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-border-default bg-surface-default p-1">
          {([
            { key: "received", label: "Received offers" },
            { key: "sent", label: "Sent offers" },
          ] as const).map((entry) => {
            const active = view === entry.key;
            const href = offersHref(status, entry.key);
            return (
              <Link
                key={entry.key}
                href={href}
                className={cx(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-primary-600 text-white" : "text-text-secondary hover:bg-surface-muted",
                )}
              >
                {entry.label}
              </Link>
            );
          })}
        </div>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-2" aria-label="Offer status">
            {tabs.map((tab) => {
              const href = offersHref(tab.status, view);
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
        {offersPending ? (
          <div className="space-y-4" role="status" aria-live="polite" aria-busy="true">
            <span className="sr-only">Loading offers</span>
            <div className="h-6 w-52 animate-pulse rounded bg-surface-muted" />
            <div className="overflow-hidden rounded-xl border border-border-default bg-surface-default">
              <div className="grid grid-cols-6 gap-3 border-b border-border-default px-4 py-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={`offers-head-skeleton-${index}`} className="h-4 animate-pulse rounded bg-surface-muted" />
                ))}
              </div>
              <div className="space-y-3 px-4 py-4">
                {Array.from({ length: 6 }).map((_, rowIndex) => (
                  <div key={`offers-row-skeleton-${rowIndex}`} className="grid grid-cols-6 gap-3">
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <div
                        key={`offers-cell-skeleton-${rowIndex}-${cellIndex}`}
                        className="h-8 animate-pulse rounded bg-surface-muted"
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : offersError ? (
          <SchoolStatePanel
            title="Unable to load offers"
            message="We could not load offers right now. Please refresh and try again."
            icon={AlertCircle}
            actionLabel="Reload"
            onAction={() => window.location.reload()}
          />
        ) : rows.length === 0 ? (
          <SchoolStatePanel
            title="No offers in this view"
            message="There are no offers matching this status and direction yet."
            icon={Inbox}
          />
        ) : (
          <SchoolOffersTable
            title={`${view === "sent" ? "Sent" : "Received"} • ${statusTabLabel}`}
            rows={rows}
            variant="offers"
            canRespond={canRespondToOffer}
            onShowDetails={(offer) => setSelectedOffer(offer)}
            onChangeStatus={(offer, nextStatus) => {
              if (nextStatus === "amendment") {
                setAmendOffer(offer);
                return;
              }
              const nextKind = nextStatus === "approved" ? "approve" : "reject";
              setConfirmAction({ kind: nextKind, offer });
            }}
            onShortlist={(offer) => {
              shortlistOfferMutation.mutate({ offerId: offer.id, orgId: offer.orgId });
            }}
            onUnshortlist={(offer) => {
              unshortlistOfferMutation.mutate({ offerId: offer.id, orgId: offer.orgId });
            }}
          />
        )}
      </div>

      <SchoolOfferDetailsDrawer open={selectedOffer != null} offer={selectedOffer} onClose={() => setSelectedOffer(null)} />

      <SchoolConfirmActionModal
        open={confirmAction != null}
        title={
          confirmAction?.kind === "approve"
            ? "Confirm acceptance"
            : confirmAction?.kind === "reject"
            ? "Confirm rejection"
            : "Confirm action"
        }
        description={
          confirmAction?.kind === "approve"
            ? "Accepting this offer will confirm the request and notify Delta Labs. The offer will move to Approved status."
            : confirmAction?.kind === "reject"
            ? "Rejecting this offer will decline the proposed allocation and send a Delta Labs confirmation to the provider."
            : ""
        }
        confirmLabel={
          confirmAction?.kind === "approve"
            ? "Accept offer"
            : confirmAction?.kind === "reject"
            ? "Reject offer"
            : ""
        }
        confirmTone={confirmAction?.kind === "reject" ? "danger" : "primary"}
        pending={updateOfferMutation.isPending}
        onCancel={() => setConfirmAction(null)}
        onConfirm={handleConfirmAction}
      />
      {amendOffer ? (
        <SchoolAmendOfferModal
          open
          offer={amendOffer}
          pending={updateOfferMutation.isPending}
          onCancel={() => setAmendOffer(null)}
          onSubmit={(payload) => {
            updateOfferMutation.mutate({
              offerId: amendOffer.id,
              orgId: amendOffer.orgId,
              nextStatus: "amendment",
              amendmentData: payload,
            });
          }}
        />
      ) : null}
    </>
  );
}
/** ################################ /COMPONENT ############################# */
