"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertCircle, Store } from "lucide-react";

import { SchoolAmendOfferModal } from "@/components/features/school/master/SchoolAmendOfferModal";
import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { SchoolEntityCard } from "@/components/features/school/master/SchoolEntityCard";
import { SchoolStatePanel } from "@/components/features/school/master/SchoolStatePanel";
import { SchoolWorkspaceHeader } from "@/components/features/school/layout/SchoolWorkspaceHeader";
import { Button, DialogOverlay, DialogPanel, Field, Input, Select, Table, Typography } from "@/components/theme";
import type { TableColumn } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { cx } from "@/components/theme/utils";
import { ApiError } from "@/lib/apiClient";
import {
  bidSchoolMarketplaceItem,
  bidGlobalSchoolMarketplaceItem,
  buySchoolMarketplaceItem,
  buyGlobalSchoolMarketplaceItem,
  createSchoolMarketplaceItem,
  deleteGlobalSchoolMarketplaceItem,
  fetchMarketplaceListingOffers,
  fetchGlobalSchoolMarketplace,
  fetchSchoolOffers,
  fetchSchoolMarketplace,
  shortlistSchoolOffer,
  type OfferDto,
  type OfferStatus,
  type MarketplaceItemDto,
  updateGlobalSchoolMarketplaceItem,
  withdrawGlobalSchoolMarketplaceItem,
  withdrawGlobalSchoolMarketplaceBid,
  updateSchoolOfferStatus,
  unshortlistSchoolOffer,
} from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isReady, isAuthenticated, session } = useAuthSession();
  const enabled = isReady && isAuthenticated;
  const [showCreate, setShowCreate] = useState(false);
  const [selectedSchoolId, setSelectedSchoolId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [bidListingId, setBidListingId] = useState<string | null>(null);
  const [bidPrice, setBidPrice] = useState("");
  const [bidNote, setBidNote] = useState("");
  const [bidActionError, setBidActionError] = useState<string | null>(null);
  const [bidReviewError, setBidReviewError] = useState<string | null>(null);
  const [bidReviewOffer, setBidReviewOffer] = useState<OfferDto | null>(null);
  const [bidReviewConfirmAction, setBidReviewConfirmAction] = useState<
    | {
        kind: "reject";
        offer: OfferDto;
      }
    | null
  >(null);
  const [bidReviewAmendOffer, setBidReviewAmendOffer] = useState<OfferDto | null>(null);
  const [dealRoomListingId, setDealRoomListingId] = useState<string | null>(null);
  const [dealRoomConfirmAction, setDealRoomConfirmAction] = useState<
    | {
        kind: "approve" | "reject";
        offer: OfferDto;
      }
    | null
  >(null);
  const [dealRoomAmendOffer, setDealRoomAmendOffer] = useState<OfferDto | null>(null);
  const [dealRoomActionError, setDealRoomActionError] = useState<string | null>(null);
  const [withdrawBidOffer, setWithdrawBidOffer] = useState<OfferDto | null>(null);
  const [listingEditItem, setListingEditItem] = useState<MarketplaceItemDto | null>(null);
  const [listingEditTitle, setListingEditTitle] = useState("");
  const [listingEditDescription, setListingEditDescription] = useState("");
  const [listingEditPrice, setListingEditPrice] = useState("");
  const [listingActionError, setListingActionError] = useState<string | null>(null);
  const [listingWithdrawItem, setListingWithdrawItem] = useState<MarketplaceItemDto | null>(null);
  const [listingDeleteItem, setListingDeleteItem] = useState<MarketplaceItemDto | null>(null);
  const queryClient = useQueryClient();

  const { activeOrgId, mySchools } = useSchoolActiveOrgId();

  const schoolsForPicker = useMemo(() => mySchools.filter((row) => !row.archived), [mySchools]);

  const queryText = searchParams.get("q") ?? "";
  const statusParam = searchParams.get("status");
  const sortByParam = searchParams.get("sortBy");
  const sortDirectionParam = searchParams.get("sortDirection");
  const pageParam = Number(searchParams.get("page") ?? "1");
  const pageSizeParam = Number(searchParams.get("pageSize") ?? "20");
  const listingStatus =
    statusParam === "active" || statusParam === "under_offer" || statusParam === "sold" || statusParam === "withdrawn"
      ? statusParam
      : undefined;
  const sortBy = sortByParam === "price" || sortByParam === "title" || sortByParam === "created_at" ? sortByParam : "created_at";
  const sortDirection = sortDirectionParam === "asc" || sortDirectionParam === "desc" ? sortDirectionParam : "desc";
  const pageNumber = Number.isFinite(pageParam) && pageParam >= 1 ? pageParam : 1;
  const pageSize = Number.isFinite(pageSizeParam) && pageSizeParam >= 1 && pageSizeParam <= 100 ? pageSizeParam : 20;
  const minPriceParam = searchParams.get("minPrice") ?? "";
  const maxPriceParam = searchParams.get("maxPrice") ?? "";
  const schoolTypeParam = searchParams.get("schoolType") ?? "";
  const schoolType = schoolTypeParam.trim() || undefined;

  const buildMarketplaceHref = (
    nextView: MarketplaceView,
    overrides?: Partial<{
      q: string;
      status: string;
      sortBy: string;
      sortDirection: string;
      minPrice: string;
      maxPrice: string;
      schoolType: string;
      page: string;
      pageSize: string;
    }>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", nextView);
    const merged = {
      q: queryText,
      status: listingStatus ?? "",
      sortBy,
      sortDirection,
      minPrice: minPriceParam,
      maxPrice: maxPriceParam,
      schoolType: schoolTypeParam,
      page: String(pageNumber),
      pageSize: String(pageSize),
      ...overrides,
    };
    const write = (key: string, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) params.delete(key);
      else params.set(key, trimmed);
    };
    write("q", merged.q);
    write("status", merged.status);
    write("sortBy", merged.sortBy);
    write("sortDirection", merged.sortDirection);
    write("minPrice", merged.minPrice);
    write("maxPrice", merged.maxPrice);
    write("schoolType", merged.schoolType);
    write("page", merged.page);
    write("pageSize", merged.pageSize);
    return `${pathname}?${params.toString()}`;
  };

  const {
    data: marketplaceData,
    error: marketplaceError,
    isPending: marketplacePending,
  } = useQuery({
    queryKey: schoolQueryKeys.marketplace(activeOrgId ?? "none", view, {
      q: queryText,
      status: listingStatus,
      schoolType,
      sortBy,
      sortDirection,
      page: pageNumber,
      pageSize,
    }),
    queryFn: () => {
      if (view === "community" || view === "bids" || view === "listings") {
        return fetchGlobalSchoolMarketplace({
          view,
          q: queryText || undefined,
          status: listingStatus,
          schoolType,
          minPrice: minPriceParam ? Number(minPriceParam) : undefined,
          maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
          sortBy,
          sortDirection,
          page: pageNumber,
          pageSize,
        });
      }
      return fetchSchoolMarketplace(activeOrgId ?? "", {
        view,
        q: queryText || undefined,
        status: listingStatus,
        schoolType,
        minPrice: minPriceParam ? Number(minPriceParam) : undefined,
        maxPrice: maxPriceParam ? Number(maxPriceParam) : undefined,
        sortBy,
        sortDirection,
        page: pageNumber,
        pageSize,
      });
    },
    enabled: enabled && (view === "community" || view === "bids" || view === "listings" || Boolean(activeOrgId)),
    staleTime: 60_000,
    retry: false,
  });
  const { data: dealRoomOffersData } = useQuery({
    queryKey: ["school", "marketplace", "deal-room", activeOrgId ?? "none", dealRoomListingId ?? "none"],
    queryFn: () => fetchMarketplaceListingOffers(activeOrgId ?? "", dealRoomListingId ?? ""),
    enabled: enabled && Boolean(activeOrgId) && Boolean(dealRoomListingId),
    staleTime: 15_000,
    retry: false,
  });
  const requestedSentOffersQuery = useQuery({
    queryKey: schoolQueryKeys.offers("global", "requested", "sent"),
    queryFn: () => fetchSchoolOffers("requested", "sent", undefined),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  const amendmentSentOffersQuery = useQuery({
    queryKey: schoolQueryKeys.offers("global", "amendment", "sent"),
    queryFn: () => fetchSchoolOffers("amendment", "sent", undefined),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  const approvedSentOffersQuery = useQuery({
    queryKey: schoolQueryKeys.offers("global", "approved", "sent"),
    queryFn: () => fetchSchoolOffers("approved", "sent", undefined),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  const rejectedSentOffersQuery = useQuery({
    queryKey: schoolQueryKeys.offers("global", "rejected", "sent"),
    queryFn: () => fetchSchoolOffers("rejected", "sent", undefined),
    enabled,
    staleTime: 30_000,
    retry: false,
  });

  const createListingMutation = useMutation({
    mutationFn: async () => {
      const selected = schoolsForPicker.find((row) => row.schoolId === selectedSchoolId);
      if (!selected) return null;
      return createSchoolMarketplaceItem(selected.orgId, {
        school_id: selectedSchoolId,
        title: title.trim(),
        description: description.trim(),
        price: Number(price),
        currency: "USD",
      });
    },
    onSuccess: async () => {
      const selected = schoolsForPicker.find((row) => row.schoolId === selectedSchoolId);
      const orgForListing = selected?.orgId ?? activeOrgId;
      if (orgForListing) {
        await queryClient.invalidateQueries({
          queryKey: schoolQueryKeys.marketplace(orgForListing, "community"),
        });
        await queryClient.invalidateQueries({
          queryKey: schoolQueryKeys.marketplace(orgForListing, "listings"),
        });
      }
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.mySchools() });
      setShowCreate(false);
      setSelectedSchoolId("");
      setTitle("");
      setDescription("");
      setPrice("");
    },
  });
  const buyListingMutation = useMutation({
    mutationFn: async (listingId: string) => {
      if (view === "community") return buyGlobalSchoolMarketplaceItem(listingId);
      if (!activeOrgId) return null;
      return buySchoolMarketplaceItem(activeOrgId, listingId);
    },
    onSuccess: async () => {
      setBidActionError(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "bids") });
      if (!activeOrgId) return;
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.marketplace(activeOrgId, "community"),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.marketplace(activeOrgId, "bids"),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.offers(activeOrgId, "requested", "sent"),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.offers(activeOrgId, "requested", "received"),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "marketplace_bid_already_exists") {
        setBidActionError("You already have an active bid for this listing. Check My Bids to continue that negotiation.");
        return;
      }
      if (error instanceof ApiError) {
        setBidActionError(error.message);
        return;
      }
      setBidActionError("Unable to process buy action right now. Please try again.");
    },
  });
  const bidListingMutation = useMutation({
    mutationFn: async () => {
      if (!bidListingId) return null;
      if (view === "community") {
        return bidGlobalSchoolMarketplaceItem({
          listing_id: bidListingId,
          offered_price: Number(bidPrice),
          offered_currency: "USD",
          note: bidNote.trim() || undefined,
        });
      }
      if (!activeOrgId) return null;
      return bidSchoolMarketplaceItem(activeOrgId, {
        listing_id: bidListingId,
        offered_price: Number(bidPrice),
        offered_currency: "USD",
        note: bidNote.trim() || undefined,
      });
    },
    onSuccess: async () => {
      setBidActionError(null);
      setBidListingId(null);
      setBidPrice("");
      setBidNote("");
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "bids") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", "requested", "sent") });
      if (!activeOrgId) return;
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.marketplace(activeOrgId, "community"),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.marketplace(activeOrgId, "bids"),
      });
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.offers(activeOrgId, "requested", "sent"),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.code === "marketplace_bid_already_exists") {
        setBidActionError("You already have an active bid for this listing. Check My Bids to continue that negotiation.");
        return;
      }
      if (error instanceof ApiError) {
        setBidActionError(error.message);
        return;
      }
      setBidActionError("Unable to submit bid right now. Please try again.");
    },
  });
  const shortlistMutation = useMutation({
    mutationFn: async (offer: OfferDto) => shortlistSchoolOffer(offer.orgId, offer.id),
    onMutate: () => {
      setDealRoomActionError(null);
    },
    onSuccess: async () => {
      if (!activeOrgId || !dealRoomListingId) return;
      await queryClient.invalidateQueries({
        queryKey: ["school", "marketplace", "deal-room", activeOrgId, dealRoomListingId],
      });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "listings") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "community") });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setDealRoomActionError(error.message);
        return;
      }
      setDealRoomActionError("Unable to shortlist this bid right now. Please try again.");
    },
  });
  const unshortlistMutation = useMutation({
    mutationFn: async (offer: OfferDto) => unshortlistSchoolOffer(offer.orgId, offer.id),
    onMutate: () => {
      setDealRoomActionError(null);
    },
    onSuccess: async () => {
      if (!activeOrgId || !dealRoomListingId) return;
      await queryClient.invalidateQueries({
        queryKey: ["school", "marketplace", "deal-room", activeOrgId, dealRoomListingId],
      });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "listings") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "community") });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setDealRoomActionError(error.message);
        return;
      }
      setDealRoomActionError("Unable to unshortlist this bid right now. Please try again.");
    },
  });
  const updateOfferDecisionMutation = useMutation({
    mutationFn: async ({
      offer,
      nextStatus,
      amendmentData,
    }: {
      offer: OfferDto;
      nextStatus: "approved" | "rejected" | "amendment";
      amendmentData?: {
        offered_price?: number;
        offered_currency?: string;
        note?: string | null;
      };
    }) => updateSchoolOfferStatus(offer.orgId, offer.id, nextStatus, amendmentData),
    onSuccess: async () => {
      if (!activeOrgId || !dealRoomListingId) return;
      await queryClient.invalidateQueries({
        queryKey: ["school", "marketplace", "deal-room", activeOrgId, dealRoomListingId],
      });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "listings") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace(activeOrgId, "bids") });
      for (const status of ["requested", "approved", "amendment", "rejected"] as const) {
        for (const offerView of ["received", "sent"] as const) {
          await queryClient.invalidateQueries({
            queryKey: schoolQueryKeys.offers(activeOrgId, status, offerView),
          });
        }
      }
      setDealRoomConfirmAction(null);
      setDealRoomAmendOffer(null);
    },
  });
  const withdrawBidMutation = useMutation({
    mutationFn: async (offerId: string) => withdrawGlobalSchoolMarketplaceBid(offerId),
    onSuccess: async () => {
      setWithdrawBidOffer(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "bids") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", "requested", "sent") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", "amendment", "sent") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", "rejected", "sent") });
    },
  });
  const respondToBidCounterMutation = useMutation({
    mutationFn: async ({
      offer,
      nextStatus,
      amendmentData,
    }: {
      offer: OfferDto;
      nextStatus: "rejected" | "amendment";
      amendmentData?: {
        offered_price?: number;
        offered_currency?: string;
        note?: string | null;
      };
    }) => updateSchoolOfferStatus(offer.orgId, offer.id, nextStatus, amendmentData),
    onMutate: () => {
      setBidReviewError(null);
    },
    onSuccess: async () => {
      setBidReviewConfirmAction(null);
      setBidReviewAmendOffer(null);
      setBidReviewOffer(null);
      setBidReviewError(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "bids") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      for (const status of ["requested", "approved", "amendment", "rejected"] as const) {
        await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", status, "sent") });
        await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.offers("global", status, "received") });
      }
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setBidReviewError(error.message);
        return;
      }
      setBidReviewError("Unable to respond to this counter right now. Please try again.");
    },
  });
  const updateListingMutation = useMutation({
    mutationFn: async ({
      listingId,
      payload,
    }: {
      listingId: string;
      payload: { title: string; description: string; price: number; currency?: string };
    }) => updateGlobalSchoolMarketplaceItem(listingId, payload),
    onMutate: () => setListingActionError(null),
    onSuccess: async () => {
      setListingEditItem(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "listings") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "bids") });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setListingActionError(error.message);
        return;
      }
      setListingActionError("Unable to update listing right now. Please try again.");
    },
  });
  const withdrawListingMutation = useMutation({
    mutationFn: async (listingId: string) => withdrawGlobalSchoolMarketplaceItem(listingId),
    onMutate: () => setListingActionError(null),
    onSuccess: async () => {
      setListingWithdrawItem(null);
      setDealRoomListingId(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "listings") });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setListingActionError(error.message);
        return;
      }
      setListingActionError("Unable to withdraw listing right now. Please try again.");
    },
  });
  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: string) => deleteGlobalSchoolMarketplaceItem(listingId),
    onMutate: () => setListingActionError(null),
    onSuccess: async () => {
      setListingDeleteItem(null);
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "community") });
      await queryClient.invalidateQueries({ queryKey: schoolQueryKeys.marketplace("global", "listings") });
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        setListingActionError(error.message);
        return;
      }
      setListingActionError("Unable to delete listing right now. Please try again.");
    },
  });

  const schools = schoolsForPicker;
  const schoolTypeOptions = useMemo(
    () => [...new Set(schoolsForPicker.map((row) => row.schoolType).filter((value) => value.trim().length > 0))].sort(),
    [schoolsForPicker],
  );
  const listings = marketplaceData?.items ?? [];
  const total = marketplaceData?.total ?? listings.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const myBidOfferByListingId = useMemo(() => {
    const allRows = [
      ...(requestedSentOffersQuery.data?.items ?? []),
      ...(amendmentSentOffersQuery.data?.items ?? []),
      ...(approvedSentOffersQuery.data?.items ?? []),
      ...(rejectedSentOffersQuery.data?.items ?? []),
    ].filter((offer) => offer.offerKind === "marketplace_transfer" && offer.listingId);
    const map = new Map<string, OfferDto>();
    for (const offer of allRows) {
      const listingId = offer.listingId ?? "";
      if (!listingId) continue;
      const current = map.get(listingId);
      if (!current) {
        map.set(listingId, offer);
        continue;
      }
      if (new Date(offer.updatedAt).getTime() >= new Date(current.updatedAt).getTime()) {
        map.set(listingId, offer);
      }
    }
    return map;
  }, [
    requestedSentOffersQuery.data?.items,
    amendmentSentOffersQuery.data?.items,
    approvedSentOffersQuery.data?.items,
    rejectedSentOffersQuery.data?.items,
  ]);
  const bidStatusLabel = (status: OfferStatus) => {
    if (status === "requested") return "Pending";
    if (status === "amendment") return "Countered";
    if (status === "approved") return "Accepted";
    return "Rejected";
  };
  const dealRoomOffers = useMemo(() => {
    const rows = dealRoomOffersData?.items ?? [];
    return [...rows].sort((a, b) => {
      if ((a.shortlisted ?? false) !== (b.shortlisted ?? false)) {
        return (b.shortlisted ? 1 : 0) - (a.shortlisted ? 1 : 0);
      }
      const ap = a.offeredPrice ?? 0;
      const bp = b.offeredPrice ?? 0;
      if (bp !== ap) return bp - ap;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [dealRoomOffersData?.items]);
  const normalizedSessionEmail = session?.user?.email?.trim().toLowerCase() ?? "";
  const canRespondToOffer = useCallback((offer: OfferDto) => {
    if (!normalizedSessionEmail) return false;
    const turn = offer.negotiationTurn ?? "recipient";
    const expected =
      turn === "recipient"
        ? offer.recipientEmail?.trim().toLowerCase()
        : offer.senderEmail?.trim().toLowerCase();
    return expected === normalizedSessionEmail;
  }, [normalizedSessionEmail]);
  const canDealRoomSellerRespond = useCallback(
    (offer: OfferDto) =>
      offer.offerKind === "marketplace_transfer" && (offer.status === "requested" || offer.status === "amendment"),
    [],
  );
  const dealRoomColumns = useMemo<readonly TableColumn<OfferDto>[]>(
    () => [
      {
        id: "bidder",
        header: "Bidder",
        className: "border-r border-border-default px-3 py-2 text-left",
        cell: (offer) => offer.partyEmail ?? offer.senderEmail ?? "Unknown",
      },
      {
        id: "bid",
        header: "Bid",
        align: "center",
        className: "border-r border-border-default px-3 py-2 text-center",
        cell: (offer) => `${offer.offeredCurrency ?? "USD"} ${offer.offeredPrice ?? 0}`,
      },
      {
        id: "status",
        header: "Status",
        align: "center",
        className: "border-r border-border-default px-3 py-2 text-center",
        cell: (offer) =>
          offer.status === "approved" ? "Accepted" : offer.status === "rejected" ? "Rejected" : offer.shortlisted ? "Shortlisted" : offer.status,
      },
      {
        id: "updated",
        header: "Updated",
        align: "center",
        className: "border-r border-border-default px-3 py-2 text-center",
        cell: (offer) => new Date(offer.updatedAt).toLocaleString(),
      },
      {
        id: "action",
        header: "Action",
        align: "center",
        className: "px-2 py-2 text-center",
        cell: (offer) => {
          const isActiveOffer = offer.status === "requested" || offer.status === "amendment";
          return (
            <div className="flex flex-wrap justify-center gap-2">
              {offer.shortlisted && isActiveOffer ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={unshortlistMutation.isPending}
                  onClick={() => unshortlistMutation.mutate(offer)}
                >
                  Unshortlist
                </Button>
              ) : isActiveOffer ? (
                <Button
                  type="button"
                  variant="primary"
                  disabled={shortlistMutation.isPending}
                  onClick={() => shortlistMutation.mutate(offer)}
                >
                  Shortlist
                </Button>
              ) : null}
              {!isActiveOffer ? <Typography className="text-xs text-text-secondary">Not active</Typography> : null}
              {(canDealRoomSellerRespond(offer) || canRespondToOffer(offer)) && isActiveOffer ? (
                <>
                  <Button
                    type="button"
                    variant="primary"
                    disabled={updateOfferDecisionMutation.isPending}
                    onClick={() => setDealRoomConfirmAction({ kind: "approve", offer })}
                  >
                    Accept
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateOfferDecisionMutation.isPending}
                    onClick={() => setDealRoomAmendOffer(offer)}
                  >
                    Counter
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={updateOfferDecisionMutation.isPending}
                    onClick={() => setDealRoomConfirmAction({ kind: "reject", offer })}
                  >
                    Reject
                  </Button>
                </>
              ) : null}
            </div>
          );
        },
      },
    ],
    [
      canRespondToOffer,
      canDealRoomSellerRespond,
      shortlistMutation,
      unshortlistMutation,
      updateOfferDecisionMutation.isPending,
    ],
  );
  const canCreateListing = useMemo(
    () =>
      selectedSchoolId.length > 0 &&
      title.trim().length > 0 &&
      description.trim().length > 0 &&
      Number(price) >= 0,
    [description, price, selectedSchoolId, title],
  );

  return (
    <>
      <SchoolWorkspaceHeader
        title="School Buy/Sell"
        actionSlot={
          <Button type="button" variant="primary" onClick={() => setShowCreate(true)}>
            Create listing
          </Button>
        }
      />
      <div className="bg-surface-canvas py-4">
        <Typography className="mb-3 text-sm text-text-secondary">
          Marketplace is the listing and discovery layer. Negotiation here runs through Deal Room offers.
        </Typography>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <nav className="flex min-w-0 flex-1 flex-wrap gap-x-6 gap-y-2" aria-label="Marketplace sections">
            {tabs.map((tab) => {
              const href = buildMarketplaceHref(tab.view, { page: "1" });
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
          <div className="w-full max-w-[20rem]">
            <Input
              id="school-marketplace-search"
              value={queryText}
              placeholder="Search listings..."
              onChange={(e) => {
                router.push(buildMarketplaceHref(view, { q: e.target.value, page: "1" }));
              }}
            />
          </div>
        </div>
      </div>
      <div className="py-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <Select
            aria-label="Listing status"
            value={listingStatus ?? ""}
            onChange={(e) => router.push(buildMarketplaceHref(view, { status: e.target.value, page: "1" }))}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="under_offer">Under offer</option>
            <option value="sold">Sold</option>
            <option value="withdrawn">Withdrawn</option>
          </Select>
          <Input
            aria-label="Minimum price"
            placeholder="Min price"
            type="number"
            min={0}
            value={minPriceParam}
            onChange={(e) => router.push(buildMarketplaceHref(view, { minPrice: e.target.value, page: "1" }))}
          />
          <Input
            aria-label="Maximum price"
            placeholder="Max price"
            type="number"
            min={0}
            value={maxPriceParam}
            onChange={(e) => router.push(buildMarketplaceHref(view, { maxPrice: e.target.value, page: "1" }))}
          />
          <Select
            aria-label="School type"
            value={schoolTypeParam}
            onChange={(e) => router.push(buildMarketplaceHref(view, { schoolType: e.target.value, page: "1" }))}
          >
            <option value="">All school types</option>
            {schoolTypeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Select
            aria-label="Sort by"
            value={sortBy}
            onChange={(e) => router.push(buildMarketplaceHref(view, { sortBy: e.target.value, page: "1" }))}
          >
            <option value="created_at">Newest</option>
            <option value="price">Price</option>
            <option value="title">Title</option>
          </Select>
          <Select
            aria-label="Sort direction"
            value={sortDirection}
            onChange={(e) => router.push(buildMarketplaceHref(view, { sortDirection: e.target.value, page: "1" }))}
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </Select>
        </div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Typography className="text-xs text-text-secondary">
            Showing {listings.length} of {total} listings
          </Typography>
          <div className="flex items-center gap-2 text-xs text-text-secondary">
            <span>Page {pageNumber}</span>
            <span>•</span>
            <span>Sort: {sortBy.replace("_", " ")} ({sortDirection})</span>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {marketplacePending ? (
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`marketplace-card-skeleton-${index}`}
                className="min-h-[188px] rounded-xl border border-border-default bg-surface-default px-4 py-4 shadow-sm"
                role="status"
                aria-live="polite"
                aria-busy="true"
              >
                <span className="sr-only">Loading marketplace listings</span>
                <div className="h-5 w-2/3 animate-pulse rounded bg-surface-muted" />
                <div className="mt-2 h-4 w-1/3 animate-pulse rounded bg-surface-muted" />
                <div className="mt-8 h-9 w-full animate-pulse rounded-md bg-surface-muted" />
                <div className="mt-3 h-9 w-full animate-pulse rounded-md bg-surface-muted" />
              </div>
            ))
          ) : marketplaceError ? (
            <SchoolStatePanel
              title="Unable to load marketplace"
              message="We could not load marketplace listings right now. Please refresh and try again."
              icon={AlertCircle}
              actionLabel="Reload"
              onAction={() => window.location.reload()}
            />
          ) : listings.length > 0 ? (
            listings.map((item) => (
              (() => {
                const isOwnedBySessionUser = Boolean(session?.user?.id) && item.ownerUserId === session?.user?.id;
                const isBidsView = view === "bids";
                const myBid = isBidsView ? myBidOfferByListingId.get(item.id) : null;
                const isCounteredBid = myBid?.status === "amendment";
                const canWithdrawBid = Boolean(myBid) && myBid?.status === "requested";
                return (
                  <SchoolEntityCard
                    key={item.id}
                    id={item.id}
                    name={item.title}
                    location={
                      isBidsView
                        ? `${item.schoolName} • Asking ${item.currency} ${item.price}`
                        : `${item.schoolName} • ${item.currency} ${item.price}`
                    }
                    partnershipLabel={
                      isBidsView
                        ? myBid
                          ? `Your bid ${myBid.offeredCurrency ?? "USD"} ${myBid.offeredPrice ?? 0} • ${bidStatusLabel(myBid.status)}`
                          : `${item.description} • No submitted bid details`
                        : `${item.description} • ${item.status.replace("_", " ")}`
                    }
                    ownerStatusBadge={
                      isOwnedBySessionUser || view === "listings"
                        ? item.status === "sold"
                          ? "Sold"
                          : item.status === "withdrawn"
                          ? "Withdrawn"
                          : "Editable"
                        : null
                    }
                    ctaVariant="marketplace"
                    primaryLabel={
                      isOwnedBySessionUser || view === "listings"
                        ? "Deal room"
                        : isBidsView
                        ? isCounteredBid
                          ? "Review counter"
                          : canWithdrawBid
                          ? "Withdraw bid"
                          : "View listing"
                        : "Bid"
                    }
                    onPrimaryAction={(listingId) => {
                      if (!listingId) return;
                      if (isOwnedBySessionUser || view === "listings") {
                        setDealRoomListingId(listingId);
                        return;
                      }
                      if (isBidsView) {
                        if (isCounteredBid) {
                          if (myBid) {
                            setBidReviewError(null);
                            setBidReviewOffer(myBid);
                          }
                          return;
                        }
                        if (canWithdrawBid && myBid) {
                          setWithdrawBidOffer(myBid);
                          return;
                        }
                        router.push(`/features/school/marketplace/${listingId}`);
                        return;
                      }
                      if (buyListingMutation.isPending || bidListingMutation.isPending) return;
                      setBidActionError(null);
                      setBidListingId(listingId);
                    }}
                    onDetailsAction={(listingId) => {
                      if (!listingId) return;
                      router.push(`/features/school/marketplace/${listingId}`);
                    }}
                    onEditAction={
                      isOwnedBySessionUser || view === "listings"
                        ? () => {
                            setListingActionError(null);
                            setListingEditItem(item);
                            setListingEditTitle(item.title);
                            setListingEditDescription(item.description);
                            setListingEditPrice(String(item.price));
                          }
                        : undefined
                    }
                    onDeleteAction={
                      isOwnedBySessionUser || view === "listings"
                        ? () => {
                            setListingActionError(null);
                            setListingDeleteItem(item);
                          }
                        : undefined
                    }
                  />
                );
              })()
            ))
          ) : (
            <SchoolStatePanel
              title="No listings found"
              message="No marketplace listings match the selected tab and filters."
              icon={Store}
            />
          )}
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            disabled={pageNumber <= 1}
            onClick={() => router.push(buildMarketplaceHref(view, { page: String(Math.max(1, pageNumber - 1)) }))}
          >
            Previous
          </Button>
          <Typography className="text-xs text-text-secondary">
            {pageNumber} / {totalPages}
          </Typography>
          <Button
            type="button"
            variant="secondary"
            disabled={pageNumber >= totalPages}
            onClick={() => router.push(buildMarketplaceHref(view, { page: String(Math.min(totalPages, pageNumber + 1)) }))}
          >
            Next
          </Button>
        </div>
      </div>
      {showCreate ? (
        <>
          <DialogOverlay onClose={() => setShowCreate(false)} />
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-3xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-2xl font-semibold text-text-primary">Create Marketplace Listing</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                <Field id="market-school" label="School">
                  <Select
                    id="market-school"
                    value={selectedSchoolId}
                    onChange={(e) => setSelectedSchoolId(e.target.value)}
                  >
                    <option value="">Choose school</option>
                    {schools.map((school) => (
                      <option key={school.schoolId} value={school.schoolId}>
                        {school.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field id="market-price" label="Price (USD)">
                  <Input
                    id="market-price"
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </Field>
                <Field id="market-title" label="Title" className="md:col-span-2">
                  <Input
                    id="market-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Listing title"
                  />
                </Field>
                <Field id="market-description" label="Description" className="md:col-span-2">
                  <Input
                    id="market-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Short description"
                  />
                </Field>
              </div>
              <div className="mt-8 flex justify-end gap-3">
                <Button type="button" variant="secondary" onClick={() => setShowCreate(false)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={!canCreateListing || createListingMutation.isPending}
                  onClick={() => createListingMutation.mutate()}
                >
                  {createListingMutation.isPending ? "Saving..." : "Save and Continue"}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </>
      ) : null}
      {bidListingId ? (
        <>
          <DialogOverlay
            onClose={() => {
              setBidListingId(null);
              setBidActionError(null);
            }}
          />
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-text-primary">Place Bid</h2>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Field id="market-bid-price" label="Bid Price (USD)">
                  <Input
                    id="market-bid-price"
                    type="number"
                    min={1}
                    value={bidPrice}
                    onChange={(e) => setBidPrice(e.target.value)}
                  />
                </Field>
                <Field id="market-bid-note" label="Bid Note (optional)">
                  <Input
                    id="market-bid-note"
                    value={bidNote}
                    onChange={(e) => setBidNote(e.target.value)}
                    placeholder="Add terms or timeline"
                  />
                </Field>
              </div>
              {bidActionError ? (
                <Typography className="mt-3 text-sm text-error-500">{bidActionError}</Typography>
              ) : null}
              <div className="mt-6 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setBidListingId(null);
                    setBidActionError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={Number(bidPrice) <= 0 || bidListingMutation.isPending}
                  onClick={() => bidListingMutation.mutate()}
                >
                  {bidListingMutation.isPending ? "Submitting..." : "Submit bid"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={buyListingMutation.isPending}
                  onClick={() => buyListingMutation.mutate(bidListingId)}
                >
                  {buyListingMutation.isPending ? "Processing..." : "Buy now"}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </>
      ) : null}
      {dealRoomListingId ? (
        <>
          <DialogOverlay
            onClose={() => {
              setDealRoomListingId(null);
              setDealRoomActionError(null);
            }}
          />
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-4xl p-6" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-semibold text-text-primary">Listing Deal Room</h2>
              <Typography className="mt-1 text-sm text-text-secondary">
                Rank incoming offers and shortlist one bidder for this listing.
              </Typography>
              <Typography className="mt-1 text-xs text-text-secondary">
                Shortlisting marks a preferred bidder only. Other bids remain active until you accept a final offer.
              </Typography>
              <div className="mt-4 max-h-[60vh] overflow-auto rounded-xl">
                <Table
                  rows={dealRoomOffers}
                  columns={dealRoomColumns}
                  rowKey={(row) => row.id}
                  tableClassName="w-full min-w-[860px] border-collapse text-sm"
                  density="compact"
                  emptyMessage="No offers yet for this listing."
                />
              </div>
              {dealRoomActionError ? (
                <Typography className="mt-3 text-sm text-error-500">{dealRoomActionError}</Typography>
              ) : null}
              <div className="mt-4 flex justify-end">
                <div className="flex gap-2">
                  {(() => {
                    const currentListing = listings.find((row) => row.id === dealRoomListingId);
                    if (!currentListing || currentListing.status === "sold" || currentListing.status === "withdrawn") return null;
                    return (
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setListingActionError(null);
                          setListingWithdrawItem(currentListing);
                        }}
                      >
                        Withdraw listing
                      </Button>
                    );
                  })()}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setDealRoomListingId(null);
                      setDealRoomActionError(null);
                    }}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </>
      ) : null}
      <SchoolConfirmActionModal
        open={dealRoomConfirmAction != null}
        title={dealRoomConfirmAction?.kind === "approve" ? "Accept offer" : "Reject offer"}
        description={
          dealRoomConfirmAction?.kind === "approve"
            ? "This approves the current marketplace offer and moves ownership transfer forward."
            : "This rejects the current marketplace offer."
        }
        confirmLabel={dealRoomConfirmAction?.kind === "approve" ? "Accept" : "Reject"}
        confirmTone={dealRoomConfirmAction?.kind === "reject" ? "danger" : "primary"}
        pending={updateOfferDecisionMutation.isPending}
        onCancel={() => setDealRoomConfirmAction(null)}
        onConfirm={() => {
          if (!dealRoomConfirmAction) return;
          updateOfferDecisionMutation.mutate({
            offer: dealRoomConfirmAction.offer,
            nextStatus: dealRoomConfirmAction.kind === "approve" ? "approved" : "rejected",
          });
        }}
      />
      {dealRoomAmendOffer ? (
        <SchoolAmendOfferModal
          key={dealRoomAmendOffer.id}
          open
          offer={dealRoomAmendOffer}
          pending={updateOfferDecisionMutation.isPending}
          onCancel={() => setDealRoomAmendOffer(null)}
          onSubmit={(payload) =>
            updateOfferDecisionMutation.mutate({
              offer: dealRoomAmendOffer,
              nextStatus: "amendment",
              amendmentData: {
                offered_price: payload.offered_price,
                offered_currency: payload.offered_currency,
                note: payload.note ?? null,
              },
            })
          }
        />
      ) : null}
      {bidReviewOffer ? (
        <>
          <DialogOverlay onClose={() => setBidReviewOffer(null)} />
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
              <Typography as="h3" className="text-lg font-semibold text-text-primary">
                Review counter offer
              </Typography>
              <Typography className="mt-2 text-sm text-text-secondary">
                {bidReviewOffer.schoolName} • Countered to {bidReviewOffer.offeredCurrency ?? "USD"}{" "}
                {bidReviewOffer.offeredPrice ?? 0}
              </Typography>
              <Typography className="mt-1 text-xs text-text-secondary">
                Respond from marketplace directly: accept, reject, or counter again.
              </Typography>
              <div className="mt-5 flex flex-wrap justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setBidReviewOffer(null)}>
                  Close
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={respondToBidCounterMutation.isPending}
                  onClick={() => setBidReviewAmendOffer(bidReviewOffer)}
                >
                  Counter
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={respondToBidCounterMutation.isPending}
                  onClick={() => {
                    setBidReviewError(null);
                    setBidReviewConfirmAction({ kind: "reject", offer: bidReviewOffer });
                  }}
                >
                  Reject
                </Button>
              </div>
              <Typography className="mt-3 text-xs text-text-secondary">
                Accepting a marketplace bid is completed by the seller from Deal Room after shortlist.
              </Typography>
              {bidReviewError ? <Typography className="mt-2 text-sm text-error-500">{bidReviewError}</Typography> : null}
            </DialogPanel>
          </div>
        </>
      ) : null}
      <SchoolConfirmActionModal
        open={bidReviewConfirmAction != null}
        title="Reject counter offer"
        description="This rejects the current seller counter for your marketplace bid."
        confirmLabel="Reject"
        confirmTone={bidReviewConfirmAction?.kind === "reject" ? "danger" : "primary"}
        pending={respondToBidCounterMutation.isPending}
        onCancel={() => setBidReviewConfirmAction(null)}
        onConfirm={() => {
          if (!bidReviewConfirmAction) return;
          respondToBidCounterMutation.mutate({
            offer: bidReviewConfirmAction.offer,
            nextStatus: "rejected",
          });
        }}
      />
      {bidReviewAmendOffer ? (
        <SchoolAmendOfferModal
          key={bidReviewAmendOffer.id}
          open
          offer={bidReviewAmendOffer}
          pending={respondToBidCounterMutation.isPending}
          onCancel={() => setBidReviewAmendOffer(null)}
          onSubmit={(payload) =>
            respondToBidCounterMutation.mutate({
              offer: bidReviewAmendOffer,
              nextStatus: "amendment",
              amendmentData: {
                offered_price: payload.offered_price,
                offered_currency: payload.offered_currency,
                note: payload.note ?? null,
              },
            })
          }
        />
      ) : null}
      <SchoolConfirmActionModal
        open={withdrawBidOffer != null}
        title="Withdraw bid?"
        description="This removes your active bid from negotiation. You can submit a new bid later."
        confirmLabel="Withdraw bid"
        confirmTone="danger"
        pending={withdrawBidMutation.isPending}
        onCancel={() => setWithdrawBidOffer(null)}
        onConfirm={() => {
          if (!withdrawBidOffer) return;
          withdrawBidMutation.mutate(withdrawBidOffer.id);
        }}
      />
      {listingEditItem ? (
        <>
          <DialogOverlay onClose={() => setListingEditItem(null)} />
          <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
            <DialogPanel className="w-full max-w-xl p-6" onClick={(e) => e.stopPropagation()}>
              <Typography as="h3" className="text-lg font-semibold text-text-primary">
                Edit listing
              </Typography>
              <div className="mt-4 grid grid-cols-1 gap-4">
                <Field id="market-edit-title" label="Title">
                  <Input id="market-edit-title" value={listingEditTitle} onChange={(e) => setListingEditTitle(e.target.value)} />
                </Field>
                <Field id="market-edit-description" label="Description">
                  <Input
                    id="market-edit-description"
                    value={listingEditDescription}
                    onChange={(e) => setListingEditDescription(e.target.value)}
                  />
                </Field>
                <Field id="market-edit-price" label="Price (USD)">
                  <Input
                    id="market-edit-price"
                    type="number"
                    min={0}
                    value={listingEditPrice}
                    onChange={(e) => setListingEditPrice(e.target.value)}
                  />
                </Field>
              </div>
              {listingActionError ? <Typography className="mt-3 text-sm text-error-500">{listingActionError}</Typography> : null}
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setListingEditItem(null)}>
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  disabled={
                    updateListingMutation.isPending ||
                    listingEditTitle.trim().length === 0 ||
                    listingEditDescription.trim().length === 0 ||
                    Number(listingEditPrice) < 0
                  }
                  onClick={() =>
                    updateListingMutation.mutate({
                      listingId: listingEditItem.id,
                      payload: {
                        title: listingEditTitle.trim(),
                        description: listingEditDescription.trim(),
                        price: Number(listingEditPrice),
                        currency: listingEditItem.currency,
                      },
                    })
                  }
                >
                  {updateListingMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </>
      ) : null}
      <SchoolConfirmActionModal
        open={listingWithdrawItem != null}
        title="Withdraw listing?"
        description="This hides the listing from active marketplace negotiation."
        confirmLabel="Withdraw listing"
        confirmTone="danger"
        pending={withdrawListingMutation.isPending}
        onCancel={() => setListingWithdrawItem(null)}
        onConfirm={() => {
          if (!listingWithdrawItem) return;
          withdrawListingMutation.mutate(listingWithdrawItem.id);
        }}
      />
      <SchoolConfirmActionModal
        open={listingDeleteItem != null}
        title="Delete listing?"
        description="This permanently removes the listing if no bids/offers exist yet."
        confirmLabel="Delete listing"
        confirmTone="danger"
        pending={deleteListingMutation.isPending}
        onCancel={() => setListingDeleteItem(null)}
        onConfirm={() => {
          if (!listingDeleteItem) return;
          deleteListingMutation.mutate(listingDeleteItem.id);
        }}
      />
    </>
  );
}
/** ################################ /COMPONENT ############################# */
