/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Offer queue tab / URL `status` values for `/features/school/offers`. */

export const OFFER_STATUSES = ["requested", "approved", "amendment", "rejected"] as const;
export const OFFER_VIEWS = ["received", "sent"] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];
export type OfferView = (typeof OFFER_VIEWS)[number];

export function isOfferStatus(value: string | undefined): value is OfferStatus {
  return value !== undefined && (OFFER_STATUSES as readonly string[]).includes(value);
}

export function isOfferView(value: string | undefined): value is OfferView {
  return value !== undefined && (OFFER_VIEWS as readonly string[]).includes(value);
}
/** ################################ /COMPONENT ############################# */
