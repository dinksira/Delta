import { expect, test } from "@playwright/test";

type ListingStatus = "active" | "under_offer" | "sold";
type OfferStatus = "requested" | "approved" | "amendment" | "rejected";

type Listing = {
  id: string;
  schoolId: string;
  schoolName: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  ownerUserId: string;
  bidderUserId: string | null;
  status: ListingStatus;
  createdAt: string;
  schoolType: string;
};

type Offer = {
  id: string;
  orgId: string;
  schoolId: string;
  schoolName: string;
  status: OfferStatus;
  requestedAt: string;
  updatedAt: string;
  recipientEmail: string;
  senderUserId: string;
  senderEmail: string;
  negotiationTurn: "sender" | "recipient";
  listingId: string;
  shortlisted: boolean;
  partyFullName: string;
  partyEmail: string;
  ownershipPercentage: number;
  offeredPrice: number;
  offeredCurrency: string;
  offerKind: "marketplace_transfer";
};

const ORG_ID = "org-1";
const USER_ID = "seller-user";
const USER_EMAIL = "seller@example.com";
const NOW = "2026-04-21T12:00:00.000Z";

function setupAuthenticatedSession() {
  return {
    accessToken: "test-token",
    refreshToken: "test-refresh",
    expiresAt: Date.now() + 60 * 60 * 1000,
    user: {
      id: USER_ID,
      email: USER_EMAIL,
      fullName: "Seller User",
    },
  };
}

test("school marketplace happy path reaches sold state", async ({ context, page }) => {
  await context.addCookies([{ name: "dl_session", value: "1", url: "http://127.0.0.1:4000" }]);
  await page.addInitScript((session) => {
    window.localStorage.setItem("dl.auth.session.v1", JSON.stringify(session));
  }, setupAuthenticatedSession());

  const mySchools = [
    { schoolId: "school-1", orgId: ORG_ID, name: "Delta Academy", slug: "delta-academy", schoolType: "University", archived: false, roleKeys: ["school_owner"] },
    { schoolId: "school-2", orgId: ORG_ID, name: "Delta Prep", slug: "delta-prep", schoolType: "High School", archived: false, roleKeys: ["school_owner"] },
  ];
  const listings: Listing[] = [];
  const offers: Offer[] = [];
  let offerCounter = 1;
  let listingCounter = 1;

  await page.route("**/v1/orgs/me", async (route) => {
    await route.fulfill({ json: { items: [{ id: ORG_ID, name: "Delta Labs Org", slug: "delta-labs-org" }] } });
  });

  await page.route("**/v1/me/schools", async (route) => {
    await route.fulfill({ json: { items: mySchools } });
  });

  await page.route(`**/v1/orgs/${ORG_ID}/schools/marketplace*`, async (route) => {
    if (route.request().method() === "GET") {
      const url = new URL(route.request().url());
      const view = url.searchParams.get("view") ?? "community";
      let items = listings;
      if (view === "listings") items = listings.filter((l) => l.ownerUserId === USER_ID);
      if (view === "bids") items = listings.filter((l) => l.bidderUserId === USER_ID);
      const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
      const status = (url.searchParams.get("status") ?? "").trim();
      const schoolType = (url.searchParams.get("schoolType") ?? "").trim();
      const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
      const pageSize = Math.max(1, Number(url.searchParams.get("pageSize") ?? "20"));
      if (q) {
        items = items.filter(
          (l) =>
            l.title.toLowerCase().includes(q) ||
            l.description.toLowerCase().includes(q) ||
            l.schoolName.toLowerCase().includes(q),
        );
      }
      if (status) items = items.filter((l) => l.status === status);
      if (schoolType) items = items.filter((l) => l.schoolType === schoolType);
      const total = items.length;
      const start = (page - 1) * pageSize;
      const pagedItems = items.slice(start, start + pageSize);
      await route.fulfill({ json: { items: pagedItems, total, page, pageSize } });
      return;
    }

    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as {
        school_id: string;
        title: string;
        description: string;
        price: number;
        currency?: string;
      };
      const created: Listing = {
        id: `mkt-${listingCounter++}`,
        schoolId: body.school_id,
        schoolName: "Delta Academy",
        title: body.title,
        description: body.description,
        price: body.price,
        currency: body.currency ?? "USD",
        ownerUserId: USER_ID,
        bidderUserId: null,
        status: "active",
        createdAt: NOW,
        schoolType: mySchools.find((s) => s.schoolId === body.school_id)?.schoolType ?? "",
      };
      listings.push(created);
      await route.fulfill({ json: created });
      return;
    }

    await route.fallback();
  });

  await page.route(`**/v1/orgs/${ORG_ID}/schools/marketplace/bid`, async (route) => {
    const body = route.request().postDataJSON() as { listing_id: string; offered_price: number; offered_currency?: string };
    const listing = listings.find((l) => l.id === body.listing_id);
    if (!listing) {
      await route.fulfill({ status: 404, json: { message: "Listing not found." } });
      return;
    }
    const created: Offer = {
      id: `offer-${offerCounter++}`,
      orgId: ORG_ID,
      schoolId: listing.schoolId,
      schoolName: listing.schoolName,
      status: "requested",
      requestedAt: NOW,
      updatedAt: NOW,
      recipientEmail: USER_EMAIL,
      senderUserId: "buyer-user",
      senderEmail: "buyer@example.com",
      negotiationTurn: "recipient",
      listingId: listing.id,
      shortlisted: false,
      partyFullName: "buyer@example.com",
      partyEmail: "buyer@example.com",
      ownershipPercentage: 100,
      offeredPrice: body.offered_price,
      offeredCurrency: body.offered_currency ?? "USD",
      offerKind: "marketplace_transfer",
    };
    offers.push(created);
    await route.fulfill({ json: created });
  });

  await page.route(`**/v1/orgs/${ORG_ID}/schools/marketplace/*/offers`, async (route) => {
    const listingId = route.request().url().split("/marketplace/")[1]?.split("/offers")[0] ?? "";
    await route.fulfill({ json: { items: offers.filter((o) => o.listingId === listingId) } });
  });

  await page.route(`**/v1/orgs/${ORG_ID}/schools/offers/*/shortlist`, async (route) => {
    const offerId = route.request().url().split("/offers/")[1]?.split("/shortlist")[0] ?? "";
    const target = offers.find((o) => o.id === offerId);
    if (!target) {
      await route.fulfill({ status: 404, json: { message: "Offer not found." } });
      return;
    }
    for (const offer of offers) {
      if (offer.listingId === target.listingId) {
        offer.shortlisted = offer.id === target.id;
      }
    }
    const listing = listings.find((l) => l.id === target.listingId);
    if (listing) {
      listing.status = "under_offer";
      listing.bidderUserId = target.senderUserId;
    }
    await route.fulfill({ json: target });
  });

  await page.route(`**/v1/orgs/${ORG_ID}/schools/offers/*/status`, async (route) => {
    const offerId = route.request().url().split("/offers/")[1]?.split("/status")[0] ?? "";
    const body = route.request().postDataJSON() as { status: OfferStatus };
    const target = offers.find((o) => o.id === offerId);
    if (!target) {
      await route.fulfill({ status: 404, json: { message: "Offer not found." } });
      return;
    }
    target.status = body.status;
    if (body.status === "approved") {
      const listing = listings.find((l) => l.id === target.listingId);
      if (listing) {
        listing.status = "sold";
        listing.bidderUserId = target.senderUserId;
      }
    }
    await route.fulfill({ json: target });
  });

  await page.goto("/features/school/marketplace?view=community");

  await page.getByRole("button", { name: "Create listing" }).click();
  await page.getByLabel("School").selectOption("school-1");
  await page.getByLabel("Price (USD)").fill("1200");
  await page.getByLabel("Title").fill("Delta Academy Listing");
  await page.getByLabel("Description").fill("Strong STEM track record");
  await page.getByRole("button", { name: "Save and Continue" }).click();
  await page.getByRole("button", { name: "Create listing" }).click();
  await page.getByLabel("School").selectOption("school-2");
  await page.getByLabel("Price (USD)").fill("1500");
  await page.getByLabel("Title").fill("Delta Prep Listing");
  await page.getByLabel("Description").fill("Strong arts program");
  await page.getByRole("button", { name: "Save and Continue" }).click();

  await expect(page.getByText("Delta Academy Listing")).toBeVisible();
  await expect(page.getByText("Delta Prep Listing")).toBeVisible();

  await page.selectOption('select[aria-label="School type"]', "University");
  await expect(page.getByText("Delta Academy Listing")).toBeVisible();
  await expect(page.getByText("Delta Prep Listing")).not.toBeVisible();

  await page.goto("/features/school/marketplace?view=community&pageSize=1");
  await expect(page.getByText("1 / 2")).toBeVisible();
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page).toHaveURL(/page=2/);

  await page.getByRole("button", { name: "Bid" }).first().click();
  await page.getByLabel("Bid Price (USD)").fill("1100");
  await page.getByRole("button", { name: "Submit bid" }).click();

  await page.goto("/features/school/marketplace?view=listings");
  await page.getByRole("button", { name: "Details" }).first().click();
  await page.getByRole("button", { name: "Shortlist" }).click();
  await page.getByRole("button", { name: "Accept" }).click();
  await page.getByRole("button", { name: "Accept offer" }).click();
  await page.getByRole("button", { name: "Close" }).click();

  await page.goto("/features/school/marketplace?view=community");
  await expect(page.getByText(/sold/i)).toBeVisible();
});
