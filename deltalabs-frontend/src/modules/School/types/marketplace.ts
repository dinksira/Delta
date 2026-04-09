/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Marketplace section / URL `view` values for `/features/school/marketplace`. */

export const MARKETPLACE_VIEWS = ["community", "bids", "listings"] as const;

export type MarketplaceView = (typeof MARKETPLACE_VIEWS)[number];

export function isMarketplaceView(value: string | undefined): value is MarketplaceView {
  return value !== undefined && (MARKETPLACE_VIEWS as readonly string[]).includes(value);
}
/** ################################ /COMPONENT ############################# */
