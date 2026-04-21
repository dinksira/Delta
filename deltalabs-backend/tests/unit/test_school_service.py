"""Unit tests for school service logic."""

from __future__ import annotations

from datetime import datetime, UTC, timedelta

import pytest

from app.core.exceptions import PermissionDeniedError, ValidationError
from app.domain.school.schemas import MarketplaceBidInput, MarketplaceBuyInput, MarketplaceUpdateInput, OfferStatusUpdateInput, SchoolCreateInput
from app.domain.school.service import Service, _validate_school_create_payload


class FakeRepository:
    def __init__(self) -> None:
        self.find_offer_calls: list[tuple[str, str]] = []
        self.update_offer_status_calls: list[tuple[str, str, str, dict | None, str | None]] = []
        self.upsert_school_membership_calls: list[tuple[str, str, str, list[str]]] = []
        self.update_school_calls: list[tuple[str, str, dict]] = []
        self.current_status = "requested"
        self.current_amendment_data: dict | None = None
        self.current_negotiation_turn = "recipient"
        self.current_offer_kind = "ownership"
        self.current_shortlisted = False
        self.current_expires_at: datetime | None = None
        self.current_amendment_rounds = 0
        self.deactivate_school_memberships_calls: list[str] = []
        self.marketplace_bids_set: list[tuple[str, str, str]] = []
        self.marketplace_status_updates: list[tuple[str, str, str, str]] = []
        self.shortlist_calls: list[tuple[str, str, str, str]] = []
        self.unshortlist_calls: list[tuple[str, str, str]] = []
        self.shortlisted_offer_for_listing: dict[str, object] | None = None
        self.commit_marketplace_calls: list[dict[str, object]] = []
        self.fail_commit_marketplace = False
        self.active_marketplace_offer_for_sender: dict[str, object] | None = None
        self.marketplace_update_calls: list[tuple[str, str, dict[str, object]]] = []
        self.marketplace_delete_calls: list[tuple[str, str]] = []
        self.marketplace_offers_count = 0
        self.latest_marketplace_offer_for_sender: dict[str, object] | None = None
        self.recent_marketplace_offer_creations_count = 0

    async def find_offer(self, org_id: str, offer_id: str) -> dict[str, object] | None:
        self.find_offer_calls.append((org_id, offer_id))
        data = {
            "_id": offer_id,
            "org_id": org_id,
            "school_id": "school-123",
            "school_name": "Test School",
            "status": self.current_status,
            "recipient_email": "recipient@example.com",
            "sender_user_id": "sender-abc",
            "sender_email": "sender@example.com",
            "negotiation_turn": self.current_negotiation_turn,
            "party_full_name": "Recipient User",
            "party_email": "recipient@example.com",
            "ownership_percentage": 50.0,
            "share_accesses": [{"access_name": "Class", "status": "can_view"}],
            "offer_kind": "ownership",
            "listing_id": "listing-1",
            "shortlisted": self.current_shortlisted,
            "requested_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
            "amendment_data": self.current_amendment_data,
            "expires_at": self.current_expires_at,
            "amendment_rounds": self.current_amendment_rounds,
        }
        data["offer_kind"] = self.current_offer_kind
        return data

    async def find_offer_by_id(self, *, offer_id: str) -> dict[str, object] | None:
        return await self.find_offer("org-1", offer_id)

    async def update_offer_status(
        self,
        *,
        org_id: str,
        offer_id: str,
        status: str,
        amendment_data: dict[str, object] | None = None,
        negotiation_turn: str | None = None,
        amendment_rounds: int | None = None,
    ) -> bool:
        self.update_offer_status_calls.append((org_id, offer_id, status, amendment_data, negotiation_turn))
        self.current_status = status
        self.current_amendment_data = amendment_data
        if negotiation_turn is not None:
            self.current_negotiation_turn = negotiation_turn
        if amendment_rounds is not None:
            self.current_amendment_rounds = amendment_rounds
        return True

    async def upsert_school_membership(
        self,
        *,
        user_id: str,
        school_id: str,
        org_id: str,
        role_keys: list[str],
    ) -> None:
        self.upsert_school_membership_calls.append((user_id, school_id, org_id, role_keys))

    async def update_school(self, *, org_id: str, school_id: str, updates: dict[str, object]) -> bool:
        self.update_school_calls.append((org_id, school_id, updates))
        return True

    async def find_user_id_by_email(self, *, email: str) -> str | None:
        return "recipient-user" if email.strip().lower() == "recipient@example.com" else None

    async def find_school(self, *, org_id: str, school_id: str) -> dict[str, object] | None:
        return {
            "_id": school_id,
            "org_id": org_id,
            "partners": [
                {
                    "full_name": "Recipient User",
                    "email": "recipient@example.com",
                    "ownership_percentage": 50.0,
                    "share_accesses": [{"access_name": "Class", "status": "can_view"}],
                }
            ],
        }

    async def find_marketplace_item(self, *, org_id: str, listing_id: str) -> dict[str, object] | None:
        if listing_id != "listing-1":
            return None
        return {
            "_id": listing_id,
            "org_id": org_id,
            "school_id": "school-123",
            "school_name": "Test School",
            "title": "Listing Title",
            "description": "Listing Description",
            "owner_user_id": "seller-user",
            "price": 1000.0,
            "currency": "USD",
            "status": "active",
            "created_at": datetime.now(UTC),
        }

    async def find_active_marketplace_offer_for_sender(
        self,
        *,
        org_id: str,
        listing_id: str,
        sender_user_id: str,
    ) -> dict[str, object] | None:
        _ = (org_id, listing_id, sender_user_id)
        return self.active_marketplace_offer_for_sender

    async def find_user_email_by_user_id(self, *, user_id: str) -> str | None:
        if user_id == "seller-user":
            return "seller@example.com"
        return None

    async def create_offer(self, **kwargs) -> dict[str, object]:
        return {
            "_id": "offer-new",
            "org_id": kwargs["org_id"],
            "school_id": kwargs["school_id"],
            "school_name": kwargs["school_name"],
            "status": "requested",
            "negotiation_turn": "recipient",
            "recipient_email": kwargs.get("recipient_email"),
            "sender_user_id": kwargs.get("sender_user_id"),
            "sender_email": kwargs.get("sender_email"),
            "party_full_name": kwargs.get("party_full_name"),
            "party_email": kwargs.get("party_email"),
            "ownership_percentage": kwargs.get("ownership_percentage"),
            "listing_id": kwargs.get("listing_id"),
            "offered_price": kwargs.get("offered_price"),
            "offered_currency": kwargs.get("offered_currency"),
            "note": kwargs.get("note"),
            "offer_kind": kwargs.get("offer_kind"),
            "expires_at": kwargs.get("expires_at"),
            "amendment_rounds": 0,
            "requested_at": datetime.now(UTC),
            "updated_at": datetime.now(UTC),
        }

    async def set_marketplace_bidder(self, *, org_id: str, listing_id: str, bidder_user_id: str) -> bool:
        self.marketplace_bids_set.append((org_id, listing_id, bidder_user_id))
        return True

    async def set_marketplace_status(
        self,
        *,
        org_id: str,
        listing_id: str,
        status: str,
        bidder_user_id: str | None = None,
    ) -> bool:
        if bidder_user_id is None:
            bidder_user_id = ""
        self.marketplace_status_updates.append((org_id, listing_id, status, bidder_user_id))
        return True

    async def update_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
        updates: dict[str, object],
    ) -> bool:
        self.marketplace_update_calls.append((org_id, listing_id, updates))
        return True

    async def delete_marketplace_item(self, *, org_id: str, listing_id: str) -> bool:
        self.marketplace_delete_calls.append((org_id, listing_id))
        return True

    async def count_marketplace_offers_for_listing(self, *, org_id: str, listing_id: str) -> int:
        _ = (org_id, listing_id)
        return self.marketplace_offers_count

    async def find_latest_marketplace_offer_for_sender(
        self,
        *,
        org_id: str,
        listing_id: str,
        sender_user_id: str,
    ) -> dict[str, object] | None:
        _ = (org_id, listing_id, sender_user_id)
        return self.latest_marketplace_offer_for_sender

    async def count_recent_marketplace_offer_creations_for_sender(
        self,
        *,
        sender_user_id: str,
        since: datetime,
    ) -> int:
        _ = (sender_user_id, since)
        return self.recent_marketplace_offer_creations_count

    async def shortlist_offer(self, *, org_id: str, offer_id: str, listing_id: str, bidder_user_id: str) -> bool:
        self.shortlist_calls.append((org_id, offer_id, listing_id, bidder_user_id))
        return True

    async def find_shortlisted_offer_for_listing(self, *, org_id: str, listing_id: str) -> dict[str, object] | None:
        return self.shortlisted_offer_for_listing

    async def unshortlist_offer(self, *, org_id: str, offer_id: str, listing_id: str) -> bool:
        self.unshortlist_calls.append((org_id, offer_id, listing_id))
        return True

    async def deactivate_school_memberships(self, *, school_id: str) -> int:
        self.deactivate_school_memberships_calls.append(school_id)
        return 1

    async def commit_marketplace_transfer_approval(
        self,
        *,
        org_id: str,
        offer_id: str,
        school_id: str,
        listing_id: str,
        buyer_user_id: str,
        negotiation_turn: str | None,
        school_updates: dict[str, object] | None,
    ) -> bool:
        self.commit_marketplace_calls.append(
            {
                "org_id": org_id,
                "offer_id": offer_id,
                "school_id": school_id,
                "listing_id": listing_id,
                "buyer_user_id": buyer_user_id,
                "negotiation_turn": negotiation_turn,
                "school_updates": school_updates,
            }
        )
        if self.fail_commit_marketplace:
            return False
        if self.current_offer_kind != "marketplace_transfer":
            return False
        if not self.current_shortlisted:
            return False
        if self.current_status not in {"requested", "amendment"}:
            return False
        self.current_status = "approved"
        if negotiation_turn is not None:
            self.current_negotiation_turn = negotiation_turn
        self.deactivate_school_memberships_calls.append(school_id)
        self.upsert_school_membership_calls.append((buyer_user_id, school_id, org_id, ["school_owner"]))
        if school_updates:
            self.update_school_calls.append((org_id, school_id, school_updates))
        self.marketplace_status_updates.append((org_id, listing_id, "sold", buyer_user_id))
        return True


@pytest.mark.asyncio
async def test_update_offer_status_amendment_requires_data() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="recipient-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="amendment"),
        )
    assert exc.value.code == "amendment_data_required"


@pytest.mark.asyncio
async def test_update_offer_status_amendment_with_data() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    amendment_data = {"ownership_percentage": 60.0, "share_accesses": [{"access_name": "Class", "status": "can_edit"}]}
    result = await service.update_offer_status(
        org_id="org-1",
        offer_id="offer-1",
        user_id="recipient-user",
        user_email="recipient@example.com",
        payload=OfferStatusUpdateInput(status="amendment", amendment_data=amendment_data),
    )

    assert result.status == "amendment"
    assert result.amendment_data == amendment_data
    assert repository.update_offer_status_calls == [("org-1", "offer-1", "amendment", amendment_data, "sender")]


@pytest.mark.asyncio
async def test_sender_can_approve_partner_amendment_and_grant_membership() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_status = "amendment"
    repository.current_negotiation_turn = "sender"
    repository.current_amendment_data = {
        "ownership_percentage": 42.0,
        "share_accesses": [{"access_name": "Class", "status": "can_manage"}],
    }

    result = await service.update_offer_status(
        org_id="org-1",
        offer_id="offer-1",
        user_id="sender-user",
        user_email="sender@example.com",
        payload=OfferStatusUpdateInput(status="approved"),
    )

    assert result.status == "approved"
    assert repository.upsert_school_membership_calls == [
        ("recipient-user", "school-123", "org-1", ["school_owner"])
    ]
    assert repository.update_school_calls


@pytest.mark.asyncio
async def test_offer_transition_blocks_terminal_status_updates() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_status = "approved"

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="recipient-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="rejected"),
        )

    assert exc.value.code == "offer_transition_invalid"


@pytest.mark.asyncio
async def test_buy_marketplace_item_creates_transfer_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    result = await service.buy_marketplace_item(
        org_id="org-1",
        buyer_user_id="buyer-user",
        buyer_email="buyer@example.com",
        payload=MarketplaceBuyInput(listing_id="listing-1"),
    )

    assert result.offer_kind == "marketplace_transfer"
    assert result.recipient_email == "seller@example.com"
    assert repository.marketplace_status_updates == [("org-1", "listing-1", "under_offer", "buyer-user")]


@pytest.mark.asyncio
async def test_buy_marketplace_item_blocks_duplicate_active_bid_for_same_user_listing() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.active_marketplace_offer_for_sender = {"_id": "offer-existing"}

    with pytest.raises(ValidationError) as exc:
        await service.buy_marketplace_item(
            org_id="org-1",
            buyer_user_id="buyer-user",
            buyer_email="buyer@example.com",
            payload=MarketplaceBuyInput(listing_id="listing-1"),
        )

    assert exc.value.code == "marketplace_bid_already_exists"


@pytest.mark.asyncio
async def test_bid_marketplace_item_creates_transfer_offer_with_bid_price() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    result = await service.bid_marketplace_item(
        org_id="org-1",
        buyer_user_id="buyer-user",
        buyer_email="buyer@example.com",
        payload=MarketplaceBidInput(listing_id="listing-1", offered_price=1234.0, offered_currency="USD"),
    )

    assert result.offer_kind == "marketplace_transfer"
    assert result.offered_price == 1234.0
    assert repository.marketplace_status_updates == []


@pytest.mark.asyncio
async def test_bid_marketplace_item_blocks_duplicate_active_bid_for_same_user_listing() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.active_marketplace_offer_for_sender = {"_id": "offer-existing"}

    with pytest.raises(ValidationError) as exc:
        await service.bid_marketplace_item(
            org_id="org-1",
            buyer_user_id="buyer-user",
            buyer_email="buyer@example.com",
            payload=MarketplaceBidInput(listing_id="listing-1", offered_price=1234.0, offered_currency="USD"),
        )

    assert exc.value.code == "marketplace_bid_already_exists"


@pytest.mark.asyncio
async def test_bid_marketplace_item_enforces_cooldown_between_bids() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.latest_marketplace_offer_for_sender = {
        "_id": "offer-recent",
        "requested_at": datetime.now(UTC) - timedelta(seconds=15),
    }

    with pytest.raises(ValidationError) as exc:
        await service.bid_marketplace_item(
            org_id="org-1",
            buyer_user_id="buyer-user",
            buyer_email="buyer@example.com",
            payload=MarketplaceBidInput(listing_id="listing-1", offered_price=1100.0, offered_currency="USD"),
        )

    assert exc.value.code == "marketplace_bid_cooldown_active"


@pytest.mark.asyncio
async def test_bid_marketplace_item_enforces_rate_limit_window() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.recent_marketplace_offer_creations_count = service._settings.marketplace_bid_rate_limit_max_creates

    with pytest.raises(ValidationError) as exc:
        await service.bid_marketplace_item(
            org_id="org-1",
            buyer_user_id="buyer-user",
            buyer_email="buyer@example.com",
            payload=MarketplaceBidInput(listing_id="listing-1", offered_price=1200.0, offered_currency="USD"),
        )

    assert exc.value.code == "marketplace_bid_rate_limited"


@pytest.mark.asyncio
async def test_bidder_can_withdraw_active_marketplace_bid() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_status = "requested"

    result = await service.withdraw_marketplace_bid_global(
        offer_id="offer-1",
        user_id="sender-abc",
    )

    assert result.status == "rejected"
    assert repository.update_offer_status_calls[-1][2] == "rejected"


@pytest.mark.asyncio
async def test_non_bidder_cannot_withdraw_marketplace_bid() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_status = "requested"

    with pytest.raises(PermissionDeniedError) as exc:
        await service.withdraw_marketplace_bid_global(
            offer_id="offer-1",
            user_id="someone-else",
        )
    assert exc.value.code == "marketplace_withdraw_forbidden"


@pytest.mark.asyncio
async def test_marketplace_amendment_allows_price_counter_only() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"

    result = await service.update_offer_status(
        org_id="org-1",
        offer_id="offer-1",
        user_id="recipient-user",
        user_email="recipient@example.com",
        payload=OfferStatusUpdateInput(
            status="amendment",
            amendment_data={"offered_price": 1400.0, "offered_currency": "USD", "note": "Counter"},
        ),
    )

    assert result.status == "amendment"
    assert result.offered_price == 1400.0


@pytest.mark.asyncio
async def test_marketplace_amendment_blocks_when_round_limit_reached() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_amendment_rounds = service._settings.marketplace_max_amendment_rounds

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="recipient-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(
                status="amendment",
                amendment_data={"offered_price": 1400.0, "offered_currency": "USD", "note": "Counter"},
            ),
        )

    assert exc.value.code == "marketplace_amendment_round_limit_reached"


@pytest.mark.asyncio
async def test_marketplace_offer_expiry_blocks_status_update() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_expires_at = datetime.now(UTC) - timedelta(minutes=1)

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="recipient-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="rejected"),
        )

    assert exc.value.code == "marketplace_bid_expired"


@pytest.mark.asyncio
async def test_seller_can_shortlist_marketplace_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"

    result = await service.shortlist_offer(
        org_id="org-1",
        offer_id="offer-1",
        user_id="seller-user",
    )

    assert result.id == "offer-1"
    assert repository.shortlist_calls == [("org-1", "offer-1", "listing-1", "sender-abc")]


@pytest.mark.asyncio
async def test_seller_can_switch_shortlisted_marketplace_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.shortlisted_offer_for_listing = {"_id": "offer-other"}

    result = await service.shortlist_offer(
        org_id="org-1",
        offer_id="offer-1",
        user_id="seller-user",
    )

    assert result.id == "offer-1"
    assert repository.shortlist_calls == [("org-1", "offer-1", "listing-1", "sender-abc")]


@pytest.mark.asyncio
async def test_seller_can_unshortlist_marketplace_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"

    async def _find_offer_shortlisted(org_id: str, offer_id: str) -> dict[str, object] | None:
        base = await FakeRepository.find_offer(repository, org_id, offer_id)
        if base is None:
            return None
        base["shortlisted"] = True
        return base

    repository.find_offer = _find_offer_shortlisted  # type: ignore[method-assign]

    result = await service.unshortlist_offer(
        org_id="org-1",
        offer_id="offer-1",
        user_id="seller-user",
    )

    assert result.id == "offer-1"
    assert repository.unshortlist_calls == [("org-1", "offer-1", "listing-1")]


@pytest.mark.asyncio
async def test_non_owner_cannot_shortlist_marketplace_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"

    with pytest.raises(PermissionDeniedError) as exc:
        await service.shortlist_offer(
            org_id="org-1",
            offer_id="offer-1",
            user_id="not-owner-user",
        )
    assert exc.value.code == "offer_shortlist_forbidden"


@pytest.mark.asyncio
async def test_seller_approves_marketplace_transfer_and_ownership_moves() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = True
    repository.shortlisted_offer_for_listing = {"_id": "offer-1"}

    result = await service.update_offer_status(
        org_id="org-1",
        offer_id="offer-1",
        user_id="seller-user",
        user_email="recipient@example.com",
        payload=OfferStatusUpdateInput(status="approved"),
    )

    assert result.status == "approved"
    assert repository.deactivate_school_memberships_calls == ["school-123"]
    assert repository.upsert_school_membership_calls[-1] == ("sender-abc", "school-123", "org-1", ["school_owner"])
    assert len(repository.commit_marketplace_calls) == 1
    assert repository.update_offer_status_calls == []


@pytest.mark.asyncio
async def test_listing_owner_can_approve_marketplace_transfer_even_when_turn_email_differs() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = True
    repository.shortlisted_offer_for_listing = {"_id": "offer-1"}
    repository.current_negotiation_turn = "recipient"

    result = await service.update_offer_status(
        org_id="org-1",
        offer_id="offer-1",
        user_id="seller-user",
        user_email="seller@example.com",
        payload=OfferStatusUpdateInput(status="approved"),
    )

    assert result.status == "approved"
    assert len(repository.commit_marketplace_calls) == 1


@pytest.mark.asyncio
async def test_seller_cannot_approve_marketplace_transfer_without_shortlist() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = False

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="seller-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="approved"),
        )

    assert exc.value.code == "marketplace_approve_requires_shortlist"


@pytest.mark.asyncio
async def test_seller_cannot_approve_marketplace_when_canonical_shortlist_is_different_offer() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = True
    repository.shortlisted_offer_for_listing = {"_id": "offer-other"}

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="seller-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="approved"),
        )

    assert exc.value.code == "marketplace_approve_shortlist_mismatch"


@pytest.mark.asyncio
async def test_seller_cannot_approve_marketplace_when_no_canonical_shortlist() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = True
    repository.shortlisted_offer_for_listing = None

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="seller-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="approved"),
        )

    assert exc.value.code == "marketplace_approve_shortlist_mismatch"


@pytest.mark.asyncio
async def test_seller_marketplace_approve_commit_conflict_raises_concurrent() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.current_offer_kind = "marketplace_transfer"
    repository.current_shortlisted = True
    repository.shortlisted_offer_for_listing = {"_id": "offer-1"}
    repository.fail_commit_marketplace = True

    with pytest.raises(ValidationError) as exc:
        await service.update_offer_status(
            org_id="org-1",
            offer_id="offer-1",
            user_id="seller-user",
            user_email="recipient@example.com",
            payload=OfferStatusUpdateInput(status="approved"),
        )

    assert exc.value.code == "marketplace_approve_concurrent"
    assert repository.current_status == "requested"


@pytest.mark.asyncio
async def test_owner_can_update_listing() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    result = await service.update_marketplace_item(
        org_id="org-1",
        listing_id="listing-1",
        user_id="seller-user",
        payload=MarketplaceUpdateInput(title="Updated", description="Updated desc", price=2000),
    )

    assert result.id == "listing-1"
    assert len(repository.marketplace_update_calls) == 1
    assert repository.marketplace_update_calls[0][0] == "org-1"


@pytest.mark.asyncio
async def test_non_owner_cannot_update_listing() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    with pytest.raises(PermissionDeniedError) as exc:
        await service.update_marketplace_item(
            org_id="org-1",
            listing_id="listing-1",
            user_id="not-owner-user",
            payload=MarketplaceUpdateInput(title="Updated"),
        )
    assert exc.value.code == "marketplace_listing_update_forbidden"


@pytest.mark.asyncio
async def test_owner_can_withdraw_listing() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)

    await service.withdraw_marketplace_item(
        org_id="org-1",
        listing_id="listing-1",
        user_id="seller-user",
    )

    assert repository.marketplace_status_updates[-1] == ("org-1", "listing-1", "withdrawn", "")


@pytest.mark.asyncio
async def test_owner_cannot_delete_listing_when_offers_exist() -> None:
    repository = FakeRepository()
    service = Service(repository=repository)
    repository.marketplace_offers_count = 1

    with pytest.raises(ValidationError) as exc:
        await service.delete_marketplace_item(
            org_id="org-1",
            listing_id="listing-1",
            user_id="seller-user",
        )
    assert exc.value.code == "marketplace_listing_delete_has_offers"


def test_validate_school_create_payload_requires_partner_share_access() -> None:
    payload = SchoolCreateInput.model_validate(
        {
            "name": "Test School",
            "school_type": "University",
            "partners": [
                {
                    "full_name": "External Partner",
                    "email": "partner@example.com",
                    "ownership_percentage": 100,
                    "share_accesses": [],
                }
            ],
        }
    )

    with pytest.raises(ValidationError) as exc:
        _validate_school_create_payload(payload, sender_email="owner@example.com")

    assert exc.value.code == "school_partner_share_access_required"


def test_validate_school_create_payload_skips_share_access_for_owner_row() -> None:
    payload = SchoolCreateInput.model_validate(
        {
            "name": "Test School",
            "school_type": "University",
            "partners": [
                {
                    "full_name": "Owner",
                    "email": "owner@example.com",
                    "ownership_percentage": 100,
                    "share_accesses": [],
                }
            ],
        }
    )

    _validate_school_create_payload(payload, sender_email="owner@example.com")
