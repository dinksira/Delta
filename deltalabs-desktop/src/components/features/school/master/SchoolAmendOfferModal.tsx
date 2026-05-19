"use client";

import { useState } from "react";

import { Button, DialogOverlay, DialogPanel, Field, Input, Select, Typography } from "@/components/theme";
import type { OfferDto } from "@/modules/School/api";

type ShareStatus = "can_view" | "can_edit" | "can_manage";

type ShareAccessDraft = Readonly<{
  access_name: string;
  status: ShareStatus;
}>;

type AmendmentPayload = Readonly<{
  ownership_percentage?: number;
  share_accesses?: ShareAccessDraft[];
  offered_price?: number;
  offered_currency?: string;
  note?: string | null;
}>;

type SchoolAmendOfferModalProps = Readonly<{
  open: boolean;
  offer: OfferDto | null;
  pending?: boolean;
  onCancel: () => void;
  onSubmit: (payload: AmendmentPayload) => void;
}>;

const DEFAULT_SHARE_ACCESSES: ShareAccessDraft[] = [
  { access_name: "Root Department", status: "can_view" },
  { access_name: "Class", status: "can_view" },
  { access_name: "Project Management", status: "can_view" },
  { access_name: "Online Course Modules", status: "can_view" },
  { access_name: "Staff and Teacher", status: "can_view" },
  { access_name: "Student Management", status: "can_view" },
  { access_name: "Academic Management", status: "can_view" },
  { access_name: "Timetable and Scheduling", status: "can_view" },
  { access_name: "Parent Portal", status: "can_view" },
  { access_name: "Hostel and Transport", status: "can_view" },
  { access_name: "Data Analytics and Reports", status: "can_view" },
  { access_name: "Document Management", status: "can_view" },
];

function initialShareAccesses(offer: OfferDto | null): ShareAccessDraft[] {
  if (offer?.amendmentData?.share_accesses?.length) {
    return offer.amendmentData.share_accesses.map((entry) => ({
      access_name: entry.access_name,
      status: entry.status,
    }));
  }
  if (offer?.shareAccesses?.length) {
    return offer.shareAccesses.map((entry) => ({
      access_name: entry.accessName,
      status: entry.status,
    }));
  }
  return DEFAULT_SHARE_ACCESSES.map((entry) => ({ ...entry }));
}

export function SchoolAmendOfferModal({
  open,
  offer,
  pending = false,
  onCancel,
  onSubmit,
}: SchoolAmendOfferModalProps) {
  const isMarketplaceTransfer = offer?.offerKind === "marketplace_transfer";
  const [ownershipPercentage, setOwnershipPercentage] = useState<string>(
    offer?.amendmentData?.ownership_percentage?.toString() ??
      offer?.ownershipPercentage?.toString() ??
      "",
  );
  const [shareAccesses, setShareAccesses] = useState<ShareAccessDraft[]>(initialShareAccesses(offer));
  const [offeredPrice, setOfferedPrice] = useState<string>(
    offer?.amendmentData?.offered_price?.toString() ?? offer?.offeredPrice?.toString() ?? "",
  );
  const [offeredCurrency, setOfferedCurrency] = useState<string>(
    offer?.amendmentData?.offered_currency ?? offer?.offeredCurrency ?? "USD",
  );
  const [note, setNote] = useState<string>(offer?.amendmentData?.note ?? offer?.note ?? "");
  const [errorText, setErrorText] = useState<string | null>(null);

  if (!open || !offer) return null;

  return (
    <>
      <DialogOverlay onClose={onCancel} />
      <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-3xl p-5" onClick={(e) => e.stopPropagation()}>
          <Typography as="h3" className="text-lg font-semibold text-text-primary">
            Request amendment
          </Typography>
          <Typography className="mt-2 text-sm text-text-secondary">
            {isMarketplaceTransfer
              ? `Propose updated bid terms for ${offer.schoolName}.`
              : `Propose updated ownership and access for ${offer.partyFullName ?? "this partner"}.`}
          </Typography>
          <div className="mt-4 space-y-4">
            {isMarketplaceTransfer ? (
              <>
                <Field id="offer-amendment-price" label="Offered Price">
                  <Input
                    id="offer-amendment-price"
                    type="number"
                    min={1}
                    value={offeredPrice}
                    onChange={(e) => setOfferedPrice(e.target.value)}
                  />
                </Field>
                <Field id="offer-amendment-currency" label="Currency">
                  <Input
                    id="offer-amendment-currency"
                    value={offeredCurrency}
                    onChange={(e) => setOfferedCurrency(e.target.value.toUpperCase())}
                    placeholder="USD"
                  />
                </Field>
                <Field id="offer-amendment-note" label="Note (optional)">
                  <Input
                    id="offer-amendment-note"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Counter terms..."
                  />
                </Field>
              </>
            ) : (
              <>
                <Field id="offer-amendment-ownership" label="Ownership Percentage">
                  <Input
                    id="offer-amendment-ownership"
                    type="number"
                    min={0}
                    max={100}
                    value={ownershipPercentage}
                    onChange={(e) => setOwnershipPercentage(e.target.value)}
                  />
                </Field>
                <div className="space-y-2">
                  <Typography className="text-sm font-semibold text-text-primary">School share access</Typography>
                  <div className="max-h-[320px] overflow-auto rounded-xl border border-border-default">
                    {shareAccesses.map((access, index) => (
                      <div
                        key={`${access.access_name}-${index}`}
                        className="grid grid-cols-[1fr_auto] items-center border-b border-border-subtle px-4 py-3 last:border-b-0"
                      >
                        <Typography className="text-sm text-text-primary">{access.access_name}</Typography>
                        <Select
                          className="max-w-[160px]"
                          value={access.status}
                          onChange={(e) => {
                            const next = [...shareAccesses];
                            next[index] = { ...next[index], status: e.target.value as ShareStatus };
                            setShareAccesses(next);
                          }}
                        >
                          <option value="can_view">Can View</option>
                          <option value="can_edit">Can Edit</option>
                          <option value="can_manage">Can Manage</option>
                        </Select>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
            {errorText ? <Typography className="text-sm text-error-500">{errorText}</Typography> : null}
          </div>
          <div className="mt-5 flex items-center justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onCancel} disabled={pending}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (isMarketplaceTransfer) {
                  const parsedPrice = Number(offeredPrice);
                  if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
                    setErrorText("Offered price must be greater than 0.");
                    return;
                  }
                  if (offeredCurrency.trim().length === 0) {
                    setErrorText("Currency is required.");
                    return;
                  }
                  const payload: AmendmentPayload = {
                    offered_price: parsedPrice,
                    offered_currency: offeredCurrency.trim().toUpperCase(),
                    note: note.trim().length > 0 ? note.trim() : null,
                  };
                  onSubmit(payload);
                } else {
                  const payload: {
                    ownership_percentage?: number;
                    share_accesses: ShareAccessDraft[];
                  } = { share_accesses: shareAccesses };
                  if (ownershipPercentage.trim().length > 0) {
                    const parsed = Number(ownershipPercentage);
                    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
                      setErrorText("Ownership percentage must be between 0 and 100.");
                      return;
                    }
                    payload.ownership_percentage = parsed;
                  }
                  onSubmit(payload);
                }
              }}
              disabled={pending}
            >
              {pending ? "Sending..." : "Send amendment"}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>
  );
}
