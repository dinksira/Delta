"use client";

import { ClipboardList, ShieldCheck, UserCheck, X } from "lucide-react";

import { Button, DialogOverlay, Typography } from "@/components/theme";
import type { OfferDto } from "@/modules/School/api";

type SchoolOfferDetailsDrawerProps = Readonly<{
  open: boolean;
  offer: OfferDto | null;
  onClose: () => void;
}>;

export function SchoolOfferDetailsDrawer({ open, offer, onClose }: SchoolOfferDetailsDrawerProps) {
  if (!open || offer == null) return null;

  const allocation = offer.ownershipPercentage != null ? `${offer.ownershipPercentage}% ownership` : "Not specified";
  const permissionLabel = offer.offerKind === "ownership" ? "Ownership invitation" : "Offer request";

  return (
    <>
      <DialogOverlay
        onClose={onClose}
        className="top-16 z-[1490] bg-black/30 backdrop-blur-[1px]"
      />
      <aside className="fixed right-0 top-16 z-[1500] flex h-[calc(100dvh-4rem)] w-full max-w-[470px] flex-col border-l border-border-default bg-surface-default shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div className="inline-flex h-7 items-center rounded-md border border-border-default px-2 text-xs text-text-secondary">
            Offer details
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted"
            aria-label="Close offer details"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <div className="rounded-2xl border border-border-default bg-surface-default px-4 py-4">
            <Typography as="h3" className="text-xl font-semibold text-text-primary">
              {offer.schoolName}
            </Typography>
            <Typography className="mt-1 text-sm text-text-secondary">
              {permissionLabel} • Status: {offer.status}
            </Typography>
            <Typography className="mt-3 text-sm text-text-secondary">
              Requested on {new Date(offer.requestedAt).toLocaleDateString()}
            </Typography>
          </div>

          <div className="rounded-2xl border border-border-default px-4 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ClipboardList className="size-4" aria-hidden />
              Allocation and offer details
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <div className="space-y-1 rounded-2xl border border-border-default bg-surface-muted p-3">
                <Typography className="text-xs uppercase tracking-[0.18em] text-text-secondary">Allocation</Typography>
                <Typography className="font-medium text-text-primary">{allocation}</Typography>
              </div>
              <div className="space-y-1 rounded-2xl border border-border-default bg-surface-muted p-3">
                <Typography className="text-xs uppercase tracking-[0.18em] text-text-secondary">Partner</Typography>
                <Typography className="font-medium text-text-primary">{offer.partyFullName ?? "Unknown"}</Typography>
                {offer.partyEmail ? <Typography className="text-xs">{offer.partyEmail}</Typography> : null}
              </div>
              <div className="space-y-1 rounded-2xl border border-border-default bg-surface-muted p-3">
                <Typography className="text-xs uppercase tracking-[0.18em] text-text-secondary">Offer source</Typography>
                <Typography className="font-medium text-text-primary">{offer.senderEmail ?? "Delta Labs"}</Typography>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border-default px-4 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <ShieldCheck className="size-4" aria-hidden />
              Permissions and next steps
            </div>
            <div className="space-y-3 text-sm text-text-secondary">
              <Typography>
                This offer is managed through Delta Labs. The recipient may respond by accepting, rejecting, or requesting an amendment.
              </Typography>
              <Typography>
                If accepted, the requested allocation will be confirmed and the school partnership will move forward. If rejected, this offer will be declined.
              </Typography>
              <Typography>
                The current status is <span className="font-medium text-text-primary">{offer.status}</span>.
              </Typography>
            </div>
          </div>

          <div className="rounded-2xl border border-border-default px-4 py-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-text-primary">
              <UserCheck className="size-4" aria-hidden />
              Recipient access
            </div>
            <div className="space-y-2 text-sm text-text-secondary">
              <Typography>
                Only the recipient email below can update this offer.
              </Typography>
              <Typography className="font-medium text-text-primary">{offer.recipientEmail ?? "Not available"}</Typography>
            </div>
          </div>
        </div>

        <div className="mt-auto border-t border-border-default px-4 py-4">
          <Button type="button" variant="primary" className="w-full" onClick={onClose}>
            Close details
          </Button>
        </div>
      </aside>
    </>
  );
}
