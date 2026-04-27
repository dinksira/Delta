/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMemo } from "react";

import { Checkbox, Table, Typography } from "@/components/theme";
import type { TableColumn } from "@/components/theme";
import { schoolChipActionButtonClass } from "@/components/features/school/schoolFeatureChipClasses";
import { SchoolSectionHeading } from "@/components/features/school/SchoolSectionHeading";
import type { OfferDto, OfferStatus } from "@/modules/School/api";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolOffersTableProps = Readonly<{
  title?: string;
  rows: readonly OfferDto[];
  variant?: "offers" | "marketplace";
  canRespond?: (offer: OfferDto) => boolean;
  onShowDetails: (offer: OfferDto) => void;
  onChangeStatus: (offer: OfferDto, status: OfferStatus) => void;
  onShortlist?: (offer: OfferDto) => void;
  onUnshortlist?: (offer: OfferDto) => void;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Offers queue table — pastel action columns per Figma. */
export function SchoolOffersTable({
  title = "Offer queue",
  rows,
  variant = "offers",
  canRespond = () => true,
  onShowDetails,
  onChangeStatus,
  onShortlist,
  onUnshortlist,
}: SchoolOffersTableProps) {
  const columns = useMemo<readonly TableColumn<OfferDto>[]>(
    () => {
      const cols: TableColumn<OfferDto>[] = [
      {
        id: "select",
        header: "",
        align: "center",
        headerClassName: "w-10 border-r border-border-default px-3 py-2 text-center",
        className: "border-r border-border-default px-3 py-2 text-center",
        cell: (row: OfferDto) => <Checkbox aria-label={`Select ${row.schoolName}`} />,
      },
      {
        id: "schoolName",
        header: "School name",
        align: "left",
        className: "border-r border-border-default px-3 py-2 text-left",
        cell: (row: OfferDto) => <span className="font-medium text-text-primary">{row.schoolName}</span>,
      },
      {
        id: "partnerStake",
        header: "Partner / stake",
        align: "left",
        className: "border-r border-border-default px-3 py-2 text-left text-text-secondary",
        cell: (row: OfferDto) =>
          row.partyFullName ? (
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-text-primary">{row.partyFullName}</span>
              {row.offerKind === "marketplace_transfer" && row.offeredPrice != null ? (
                <span className="text-xs">
                  Bid: {row.offeredCurrency ?? "USD"} {row.offeredPrice}
                </span>
              ) : row.ownershipPercentage != null ? (
                <span className="text-xs">{row.ownershipPercentage}% ownership</span>
              ) : null}
              {row.partyEmail ? <span className="text-xs">{row.partyEmail}</span> : null}
            </div>
          ) : (
            <span className="text-xs">—</span>
          ),
      },
      {
        id: "date",
        header: "Date",
        align: "center",
        className: "border-r border-border-default px-3 py-2 text-center text-text-secondary",
        cell: (row: OfferDto) => new Date(row.requestedAt).toLocaleDateString(),
      },
      {
        id: "detail",
        header: "Detail",
        align: "center",
        className: "border-r border-border-default px-2 py-2 text-center",
        cell: (row: OfferDto) => (
          <button type="button" className={schoolChipActionButtonClass("cyan")} onClick={() => onShowDetails(row)}>
            Detail
          </button>
        ),
      },
      {
        id: "approve",
        header: "Approve",
        align: "center",
        className: "border-r border-border-default px-2 py-2 text-center",
        cell: (row: OfferDto) =>
          canRespond(row) && (row.status === "requested" || row.status === "amendment") ? (
            <button type="button" className={schoolChipActionButtonClass("emerald")} onClick={() => onChangeStatus(row, "approved")}>
              Approve
            </button>
          ) : (
            <Typography className="px-2 text-xs text-text-secondary">Track only</Typography>
          ),
      },
      {
        id: "amendment",
        header: "Amendment",
        align: "center",
        className: "border-r border-border-default px-2 py-2 text-center",
        cell: (row: OfferDto) =>
          canRespond(row) && (row.status === "requested" || row.status === "amendment") ? (
            <button type="button" className={schoolChipActionButtonClass("violet")} onClick={() => onChangeStatus(row, "amendment")}>
              Amendment
            </button>
          ) : (
            <Typography className="px-2 text-xs text-text-secondary">Track only</Typography>
          ),
      },
      {
        id: "rejected",
        header: "Rejected",
        align: "center",
        className: "px-2 py-2 text-center",
        cell: (row: OfferDto) =>
          canRespond(row) && (row.status === "requested" || row.status === "amendment") ? (
            <button type="button" className={schoolChipActionButtonClass("rose")} onClick={() => onChangeStatus(row, "rejected")}>
              Reject
            </button>
          ) : (
            <Typography className="px-2 text-xs text-text-secondary">Track only</Typography>
          ),
      },
      ];

      if (variant === "marketplace") {
        cols.splice(cols.length - 1, 0, {
          id: "shortlist",
          header: "Shortlist",
          align: "center",
          className: "border-r border-border-default px-2 py-2 text-center",
          cell: (row: OfferDto) =>
            (onShortlist || onUnshortlist) &&
            canRespond(row) &&
            row.offerKind === "marketplace_transfer" &&
            row.status !== "approved" &&
            row.status !== "rejected" ? (
              <button
                type="button"
                className={schoolChipActionButtonClass("cyan")}
                onClick={() => {
                  if (row.shortlisted) onUnshortlist?.(row);
                  else onShortlist?.(row);
                }}
              >
                {row.shortlisted ? "Unshortlist" : "Shortlist"}
              </button>
            ) : (
              <Typography className="px-2 text-xs text-text-secondary">Track only</Typography>
            ),
        });
      }

      return cols;
    },
    [canRespond, onChangeStatus, onShowDetails, onShortlist, onUnshortlist, variant],
  );

  return (
    <div className="space-y-4">
      <SchoolSectionHeading title={title} titleAs="h2" />
      <Table
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        tableClassName="w-full min-w-[720px] border-collapse text-sm"
        density="compact"
        emptyMessage="No offers found for this status."
      />
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
