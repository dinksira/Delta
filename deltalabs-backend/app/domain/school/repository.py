"""School repository backed by MongoDB."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING
from pymongo.errors import OperationFailure

from app.domain.school.schemas import MarketplaceSortBy, MarketplaceSortDirection, OfferListView, OfferStatus


class _AbortMarketplaceApproval(Exception):
    """Raised inside a transaction when the offer is no longer eligible (no side effects)."""


class Repository:
    """MongoDB access layer for school workspace entities."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        await self._db["schools"].create_index(
            [("org_id", ASCENDING), ("archived", ASCENDING), ("name", ASCENDING)],
            name="ix_schools_org_archived_name",
        )
        await self._db["schools"].create_index(
            [("org_id", ASCENDING), ("slug", ASCENDING)],
            unique=True,
            name="uq_schools_org_slug",
        )
        await self._db["school_marketplace"].create_index(
            [("org_id", ASCENDING), ("created_at", ASCENDING)],
            name="ix_school_marketplace_org_created",
        )
        await self._db["school_offers"].create_index(
            [("org_id", ASCENDING), ("status", ASCENDING), ("updated_at", ASCENDING)],
            name="ix_school_offers_org_status_updated",
        )
        await self._db["school_memberships"].create_index(
            [("user_id", ASCENDING), ("school_id", ASCENDING)],
            unique=True,
            name="uq_school_memberships_user_school",
        )
        await self._db["school_memberships"].create_index(
            [("school_id", ASCENDING)],
            name="ix_school_memberships_school",
        )
        await self._db["school_workspace_items"].create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("type", ASCENDING), ("created_at", ASCENDING)],
            name="ix_school_workspace_items_org_school_type_created",
        )
        await self._db["school_workspace_items"].create_index(
            [("org_id", ASCENDING), ("school_id", ASCENDING), ("is_root", ASCENDING)],
            unique=True,
            partialFilterExpression={"is_root": True},
            name="uq_school_workspace_items_single_root",
        )

    async def ping(self) -> bool:
        return True

    async def list_schools(self, *, org_id: str, archived: bool) -> list[dict[str, Any]]:
        cursor = (
            self._db["schools"]
            .find({"org_id": org_id, "archived": archived})
            .sort([("updated_at", ASCENDING), ("name", ASCENDING)])
        )
        return await cursor.to_list(length=500)

    async def create_school(
        self,
        *,
        org_id: str,
        user_id: str,
        name: str,
        school_type: str,
        email: str | None,
        logo_url: str | None,
        custom_fields: list[dict[str, Any]],
        onboarding_status: str,
        partners: list[dict[str, Any]],
        documents: list[dict[str, Any]],
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        slug = _slugify(name)
        clean_custom_fields = []
        for field in custom_fields:
            key = str(field.get("key", "")).strip()
            value = str(field.get("value", "")).strip()
            if not key or not value:
                continue
            clean_custom_fields.append({"key": key, "value": value})
        doc = {
            "_id": f"school_{uuid4().hex}",
            "org_id": org_id,
            "name": name.strip(),
            "slug": slug,
            "school_type": school_type.strip(),
            "email": email.strip().lower() if isinstance(email, str) and email.strip() else None,
            "logo_url": logo_url.strip() if isinstance(logo_url, str) and logo_url.strip() else None,
            "custom_fields": clean_custom_fields,
            "onboarding_status": onboarding_status,
            "partners": partners,
            "documents": documents,
            "created_by_user_id": user_id,
            "archived": False,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["schools"].insert_one(doc)
        return doc

    async def ensure_school_workspace_root(self, *, org_id: str, school_id: str) -> dict[str, Any]:
        now = datetime.now(UTC)
        root = await self._db["school_workspace_items"].find_one(
            {"org_id": org_id, "school_id": school_id, "is_root": True}
        )
        if isinstance(root, dict):
            return root
        doc = {
            "_id": f"wsi_{uuid4().hex}",
            "org_id": org_id,
            "school_id": school_id,
            "parent_id": None,
            "type": "department",
            "title": "Root Department",
            "description": "Default root department for this school workspace.",
            "metadata": {"default": True},
            "is_root": True,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["school_workspace_items"].insert_one(doc)
        return doc

    async def create_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_type: str,
        title: str,
        description: str | None,
        metadata: dict[str, Any],
        parent_id: str | None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc = {
            "_id": f"wsi_{uuid4().hex}",
            "org_id": org_id,
            "school_id": school_id,
            "parent_id": parent_id,
            "type": item_type,
            "title": title.strip(),
            "description": description.strip() if isinstance(description, str) and description.strip() else None,
            "metadata": metadata,
            "is_root": False,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["school_workspace_items"].insert_one(doc)
        return doc

    async def list_school_workspace_items(
        self,
        *,
        org_id: str,
        school_id: str,
        item_type: str | None = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"org_id": org_id, "school_id": school_id}
        if isinstance(item_type, str) and item_type.strip():
            query["type"] = item_type.strip()
        cursor = self._db["school_workspace_items"].find(query).sort(
            [("is_root", -1), ("created_at", ASCENDING), ("title", ASCENDING)]
        )
        return await cursor.to_list(length=1000)

    async def find_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_workspace_items"].find_one(
            {"_id": item_id, "org_id": org_id, "school_id": school_id}
        )

    async def update_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
        updates: dict[str, Any],
    ) -> bool:
        safe_updates = dict(updates)
        safe_updates["updated_at"] = datetime.now(UTC)
        result = await self._db["school_workspace_items"].update_one(
            {"_id": item_id, "org_id": org_id, "school_id": school_id},
            {"$set": safe_updates},
        )
        return result.matched_count > 0

    async def delete_school_workspace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        item_id: str,
    ) -> bool:
        result = await self._db["school_workspace_items"].delete_one(
            {"_id": item_id, "org_id": org_id, "school_id": school_id}
        )
        return result.deleted_count > 0

    async def set_school_archived(self, *, org_id: str, school_id: str, archived: bool) -> bool:
        result = await self._db["schools"].update_one(
            {"_id": school_id, "org_id": org_id},
            {"$set": {"archived": archived, "updated_at": datetime.now(UTC)}},
        )
        return result.matched_count > 0

    async def update_school(self, *, org_id: str, school_id: str, updates: dict[str, Any]) -> bool:
        updates["updated_at"] = datetime.now(UTC)
        result = await self._db["schools"].update_one(
            {"_id": school_id, "org_id": org_id},
            {"$set": updates},
        )
        return result.matched_count > 0

    async def create_marketplace_item(
        self,
        *,
        org_id: str,
        school_id: str,
        school_name: str,
        owner_user_id: str,
        title: str,
        description: str,
        price: float,
        currency: str,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        school_doc = await self.find_school(org_id=org_id, school_id=school_id)
        school_type = ""
        if isinstance(school_doc, dict):
            raw_school_type = school_doc.get("school_type")
            if isinstance(raw_school_type, str):
                school_type = raw_school_type
        doc = {
            "_id": f"mkt_{uuid4().hex}",
            "org_id": org_id,
            "school_id": school_id,
            "school_name": school_name,
            "school_type": school_type,
            "owner_user_id": owner_user_id,
            "bidder_user_id": None,
            "status": "active",
            "title": title.strip(),
            "description": description.strip(),
            "price": float(price),
            "currency": currency.upper(),
            "created_at": now,
        }
        await self._db["school_marketplace"].insert_one(doc)
        return doc

    async def list_marketplace_items(
        self,
        *,
        org_id: str,
        user_id: str,
        view: str,
        query_text: str | None = None,
        status: str | None = None,
        school_type: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: MarketplaceSortBy = "created_at",
        sort_direction: MarketplaceSortDirection = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        query: dict[str, Any] = {"org_id": org_id}
        if view == "bids":
            query["bidder_user_id"] = user_id
        elif view == "listings":
            query["owner_user_id"] = user_id
        if status:
            query["status"] = status
        if school_type:
            query["school_type"] = school_type
        if min_price is not None or max_price is not None:
            price_filter: dict[str, Any] = {}
            if min_price is not None:
                price_filter["$gte"] = float(min_price)
            if max_price is not None:
                price_filter["$lte"] = float(max_price)
            query["price"] = price_filter
        if query_text:
            query["$or"] = [
                {"title": {"$regex": query_text, "$options": "i"}},
                {"description": {"$regex": query_text, "$options": "i"}},
                {"school_name": {"$regex": query_text, "$options": "i"}},
            ]

        sort_field = {
            "created_at": "created_at",
            "price": "price",
            "title": "title",
        }[sort_by]
        sort_order = ASCENDING if sort_direction == "asc" else -1
        safe_page = max(1, int(page))
        safe_page_size = max(1, min(100, int(page_size)))
        skip = (safe_page - 1) * safe_page_size
        total = await self._db["school_marketplace"].count_documents(query)
        cursor = (
            self._db["school_marketplace"]
            .find(query)
            .sort([(sort_field, sort_order)])
            .skip(skip)
            .limit(safe_page_size)
        )
        return await cursor.to_list(length=safe_page_size), int(total)

    async def list_marketplace_items_global(
        self,
        *,
        user_id: str | None = None,
        view: str = "community",
        query_text: str | None = None,
        status: str | None = None,
        school_type: str | None = None,
        min_price: float | None = None,
        max_price: float | None = None,
        sort_by: MarketplaceSortBy = "created_at",
        sort_direction: MarketplaceSortDirection = "desc",
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[dict[str, Any]], int]:
        query: dict[str, Any] = {}
        if view == "listings" and user_id:
            query["owner_user_id"] = user_id
        if status:
            query["status"] = status
        if school_type:
            query["school_type"] = school_type
        if min_price is not None or max_price is not None:
            price_filter: dict[str, Any] = {}
            if min_price is not None:
                price_filter["$gte"] = float(min_price)
            if max_price is not None:
                price_filter["$lte"] = float(max_price)
            query["price"] = price_filter
        if query_text:
            query["$or"] = [
                {"title": {"$regex": query_text, "$options": "i"}},
                {"description": {"$regex": query_text, "$options": "i"}},
                {"school_name": {"$regex": query_text, "$options": "i"}},
            ]
        sort_field = {
            "created_at": "created_at",
            "price": "price",
            "title": "title",
        }[sort_by]
        sort_order = ASCENDING if sort_direction == "asc" else -1
        safe_page = max(1, int(page))
        safe_page_size = max(1, min(100, int(page_size)))
        skip = (safe_page - 1) * safe_page_size

        if view == "bids" and user_id:
            offer_query: dict[str, Any] = {
                "sender_user_id": user_id,
                "offer_kind": "marketplace_transfer",
            }
            offer_cursor = self._db["school_offers"].find(offer_query).sort([("updated_at", -1)])
            offer_docs = await offer_cursor.to_list(length=1000)
            listing_ids: list[str] = []
            seen: set[str] = set()
            for doc in offer_docs:
                raw_listing_id = doc.get("listing_id")
                if not isinstance(raw_listing_id, str) or not raw_listing_id.strip():
                    continue
                listing_id = raw_listing_id.strip()
                if listing_id in seen:
                    continue
                seen.add(listing_id)
                listing_ids.append(listing_id)
            if len(listing_ids) == 0:
                return [], 0
            listing_query = dict(query)
            listing_query["_id"] = {"$in": listing_ids}
            listing_docs = await self._db["school_marketplace"].find(listing_query).to_list(length=1000)
            by_id: dict[str, dict[str, Any]] = {
                str(doc.get("_id", "")): doc
                for doc in listing_docs
                if isinstance(doc.get("_id"), str)
            }
            ordered = [by_id[lid] for lid in listing_ids if lid in by_id]
            total = len(ordered)
            return ordered[skip : skip + safe_page_size], total

        total = await self._db["school_marketplace"].count_documents(query)
        cursor = (
            self._db["school_marketplace"]
            .find(query)
            .sort([(sort_field, sort_order)])
            .skip(skip)
            .limit(safe_page_size)
        )
        return await cursor.to_list(length=safe_page_size), int(total)

    async def create_offer(
        self,
        *,
        org_id: str,
        school_id: str,
        school_name: str,
        sender_user_id: str | None = None,
        sender_email: str | None = None,
        recipient_email: str | None = None,
        party_full_name: str | None = None,
        party_email: str | None = None,
        ownership_percentage: float | None = None,
        share_accesses: list[dict[str, Any]] | None = None,
        listing_id: str | None = None,
        offered_price: float | None = None,
        offered_currency: str | None = None,
        note: str | None = None,
        offer_kind: str | None = None,
        expires_at: datetime | None = None,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        doc: dict[str, Any] = {
            "_id": f"offer_{uuid4().hex}",
            "org_id": org_id,
            "school_id": school_id,
            "school_name": school_name,
            "status": "requested",
            "negotiation_turn": "recipient",
            "requested_at": now,
            "updated_at": now,
        }
        if party_full_name is not None:
            doc["party_full_name"] = party_full_name
        if party_email is not None:
            doc["party_email"] = party_email
        if sender_user_id is not None:
            doc["sender_user_id"] = sender_user_id
        if sender_email is not None:
            doc["sender_email"] = sender_email
        if recipient_email is not None:
            doc["recipient_email"] = recipient_email
        if ownership_percentage is not None:
            doc["ownership_percentage"] = ownership_percentage
        if share_accesses is not None:
            doc["share_accesses"] = share_accesses
        if listing_id is not None:
            doc["listing_id"] = listing_id
        if offered_price is not None:
            doc["offered_price"] = float(offered_price)
        if offered_currency is not None:
            doc["offered_currency"] = offered_currency.upper()
        if note is not None:
            doc["note"] = note
        if offer_kind is not None:
            doc["offer_kind"] = offer_kind
        if offer_kind == "marketplace_transfer":
            doc["amendment_rounds"] = 0
        if expires_at is not None:
            doc["expires_at"] = expires_at
        await self._db["school_offers"].insert_one(doc)
        return doc

    async def find_marketplace_item(self, *, org_id: str, listing_id: str) -> dict[str, Any] | None:
        return await self._db["school_marketplace"].find_one({"_id": listing_id, "org_id": org_id})

    async def find_marketplace_item_by_id(self, *, listing_id: str) -> dict[str, Any] | None:
        return await self._db["school_marketplace"].find_one({"_id": listing_id})

    async def update_marketplace_item(
        self,
        *,
        org_id: str,
        listing_id: str,
        updates: dict[str, Any],
    ) -> bool:
        safe_updates = dict(updates)
        safe_updates["updated_at"] = datetime.now(UTC)
        result = await self._db["school_marketplace"].update_one(
            {"_id": listing_id, "org_id": org_id},
            {"$set": safe_updates},
        )
        return result.matched_count > 0

    async def delete_marketplace_item(self, *, org_id: str, listing_id: str) -> bool:
        result = await self._db["school_marketplace"].delete_one({"_id": listing_id, "org_id": org_id})
        return result.deleted_count > 0

    async def count_marketplace_offers_for_listing(self, *, org_id: str, listing_id: str) -> int:
        return int(
            await self._db["school_offers"].count_documents(
                {"org_id": org_id, "listing_id": listing_id, "offer_kind": "marketplace_transfer"}
            )
        )

    async def find_latest_marketplace_offer_for_sender(
        self,
        *,
        org_id: str,
        listing_id: str,
        sender_user_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_offers"].find_one(
            {
                "org_id": org_id,
                "listing_id": listing_id,
                "offer_kind": "marketplace_transfer",
                "sender_user_id": sender_user_id,
            },
            sort=[("requested_at", -1)],
        )

    async def count_recent_marketplace_offer_creations_for_sender(
        self,
        *,
        sender_user_id: str,
        since: datetime,
    ) -> int:
        return int(
            await self._db["school_offers"].count_documents(
                {
                    "offer_kind": "marketplace_transfer",
                    "sender_user_id": sender_user_id,
                    "requested_at": {"$gte": since},
                }
            )
        )

    async def set_marketplace_bidder(self, *, org_id: str, listing_id: str, bidder_user_id: str) -> bool:
        result = await self._db["school_marketplace"].update_one(
            {"_id": listing_id, "org_id": org_id},
            {"$set": {"bidder_user_id": bidder_user_id}},
        )
        return result.matched_count > 0

    async def set_marketplace_status(
        self,
        *,
        org_id: str,
        listing_id: str,
        status: str,
        bidder_user_id: str | None = None,
    ) -> bool:
        update_doc: dict[str, Any] = {"status": status}
        if bidder_user_id is not None:
            update_doc["bidder_user_id"] = bidder_user_id
        result = await self._db["school_marketplace"].update_one(
            {"_id": listing_id, "org_id": org_id},
            {"$set": update_doc},
        )
        return result.matched_count > 0

    async def list_offers(
        self,
        *,
        org_id: str,
        status: OfferStatus,
        view: OfferListView,
        user_id: str,
        user_email: str | None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"org_id": org_id, "status": status}
        if view == "sent":
            query["sender_user_id"] = user_id
        else:
            if user_email is None:
                return []
            query["recipient_email"] = user_email.strip().lower()
        cursor = self._db["school_offers"].find(query).sort([("updated_at", ASCENDING)])
        return await cursor.to_list(length=500)

    async def list_offers_for_user(
        self,
        *,
        status: OfferStatus,
        view: OfferListView,
        user_id: str,
        user_email: str | None,
        org_id: str | None = None,
    ) -> list[dict[str, Any]]:
        query: dict[str, Any] = {"status": status}
        if org_id:
            query["org_id"] = org_id
        if view == "sent":
            query["sender_user_id"] = user_id
        else:
            if user_email is None:
                return []
            query["recipient_email"] = user_email.strip().lower()
        cursor = self._db["school_offers"].find(query).sort([("updated_at", ASCENDING)])
        return await cursor.to_list(length=500)

    async def list_marketplace_offers_for_listing(self, *, org_id: str, listing_id: str) -> list[dict[str, Any]]:
        cursor = self._db["school_offers"].find(
            {
                "org_id": org_id,
                "listing_id": listing_id,
                "offer_kind": "marketplace_transfer",
            }
        ).sort([("shortlisted", ASCENDING), ("offered_price", ASCENDING), ("updated_at", ASCENDING)])
        return await cursor.to_list(length=500)

    async def update_offer_status(
        self,
        *,
        org_id: str,
        offer_id: str,
        status: OfferStatus,
        amendment_data: dict[str, object] | None = None,
        negotiation_turn: str | None = None,
        amendment_rounds: int | None = None,
    ) -> bool:
        update_doc = {"status": status, "updated_at": datetime.now(UTC)}
        if amendment_data is not None:
            update_doc["amendment_data"] = amendment_data
        if negotiation_turn is not None:
            update_doc["negotiation_turn"] = negotiation_turn
        if amendment_rounds is not None:
            update_doc["amendment_rounds"] = amendment_rounds
        result = await self._db["school_offers"].update_one(
            {"_id": offer_id, "org_id": org_id},
            {"$set": update_doc},
        )
        return result.matched_count > 0

    async def commit_marketplace_transfer_approval(
        self,
        *,
        org_id: str,
        offer_id: str,
        school_id: str,
        listing_id: str,
        buyer_user_id: str,
        negotiation_turn: str | None,
        school_updates: dict[str, Any] | None,
    ) -> bool:
        """Atomically approve a marketplace transfer offer and complete ownership transfer.

        Requires MongoDB replica set (multi-document transactions). The offer update is
        conditional so concurrent approvals do not partially apply side effects.
        """
        now = datetime.now(UTC)
        buyer_org_id = await self._resolve_or_create_buyer_org_id(buyer_user_id=buyer_user_id, now=now)
        client = self._db.client
        try:
            async with await client.start_session() as session:
                async with session.start_transaction():
                    set_doc: dict[str, Any] = {"status": "approved", "updated_at": now}
                    if negotiation_turn is not None:
                        set_doc["negotiation_turn"] = negotiation_turn

                    offer_result = await self._db["school_offers"].update_one(
                        {
                            "_id": offer_id,
                            "org_id": org_id,
                            "offer_kind": "marketplace_transfer",
                            "shortlisted": True,
                            "status": {"$in": ["requested", "amendment"]},
                        },
                        {"$set": set_doc},
                        session=session,
                    )
                    if offer_result.matched_count == 0:
                        raise _AbortMarketplaceApproval

                    await self._db["school_memberships"].update_many(
                        {"school_id": school_id, "status": "active"},
                        {"$set": {"status": "inactive", "updated_at": now}},
                        session=session,
                    )

                    await self._db["school_memberships"].update_one(
                        {"user_id": buyer_user_id, "school_id": school_id},
                        {
                            "$set": {
                                "org_id": buyer_org_id,
                                "role_keys": ["school_owner"],
                                "status": "active",
                                "updated_at": now,
                            },
                            "$setOnInsert": {"created_at": now},
                        },
                        upsert=True,
                        session=session,
                    )
                    await self._db["org_memberships"].update_one(
                        {"org_id": buyer_org_id, "user_id": buyer_user_id},
                        {
                            "$set": {"status": "active", "updated_at": now},
                            "$setOnInsert": {"created_at": now},
                        },
                        upsert=True,
                        session=session,
                    )

                    su = dict(school_updates) if school_updates else {}
                    su["created_by_user_id"] = buyer_user_id
                    su["org_id"] = buyer_org_id
                    su["updated_at"] = now
                    school_result = await self._db["schools"].update_one(
                        {"_id": school_id, "org_id": org_id},
                        {"$set": su},
                        session=session,
                    )
                    if school_result.matched_count == 0:
                        raise RuntimeError("marketplace_commit_school_not_found")

                    mkt_result = await self._db["school_marketplace"].update_one(
                        {"_id": listing_id, "org_id": org_id},
                        {"$set": {"status": "sold", "bidder_user_id": buyer_user_id, "org_id": buyer_org_id}},
                        session=session,
                    )
                    if mkt_result.matched_count == 0:
                        raise RuntimeError("marketplace_commit_listing_not_found")
        except OperationFailure as exc:
            # Local/dev Mongo instances commonly run standalone without transaction support.
            if exc.code != 20:
                raise
            return await self._commit_marketplace_transfer_approval_without_transaction(
                org_id=org_id,
                offer_id=offer_id,
                school_id=school_id,
                listing_id=listing_id,
                buyer_user_id=buyer_user_id,
                buyer_org_id=buyer_org_id,
                negotiation_turn=negotiation_turn,
                school_updates=school_updates,
            )
        except _AbortMarketplaceApproval:
            return False
        return True

    async def _commit_marketplace_transfer_approval_without_transaction(
        self,
        *,
        org_id: str,
        offer_id: str,
        school_id: str,
        listing_id: str,
        buyer_user_id: str,
        buyer_org_id: str,
        negotiation_turn: str | None,
        school_updates: dict[str, Any] | None,
    ) -> bool:
        """Fallback commit path for Mongo standalone deployments (no transactions)."""
        now = datetime.now(UTC)
        set_doc: dict[str, Any] = {"status": "approved", "updated_at": now}
        if negotiation_turn is not None:
            set_doc["negotiation_turn"] = negotiation_turn

        offer_result = await self._db["school_offers"].update_one(
            {
                "_id": offer_id,
                "org_id": org_id,
                "offer_kind": "marketplace_transfer",
                "shortlisted": True,
                "status": {"$in": ["requested", "amendment"]},
            },
            {"$set": set_doc},
        )
        if offer_result.matched_count == 0:
            return False

        await self._db["school_memberships"].update_many(
            {"school_id": school_id, "status": "active"},
            {"$set": {"status": "inactive", "updated_at": now}},
        )
        await self._db["school_memberships"].update_one(
            {"user_id": buyer_user_id, "school_id": school_id},
            {
                "$set": {
                    "org_id": buyer_org_id,
                    "role_keys": ["school_owner"],
                    "status": "active",
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        await self._db["org_memberships"].update_one(
            {"org_id": buyer_org_id, "user_id": buyer_user_id},
            {
                "$set": {"status": "active", "updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        su = dict(school_updates) if school_updates else {}
        su["created_by_user_id"] = buyer_user_id
        su["org_id"] = buyer_org_id
        su["updated_at"] = now
        school_result = await self._db["schools"].update_one(
            {"_id": school_id, "org_id": org_id},
            {"$set": su},
        )
        if school_result.matched_count == 0:
            raise RuntimeError("marketplace_commit_school_not_found")
        mkt_result = await self._db["school_marketplace"].update_one(
            {"_id": listing_id, "org_id": org_id},
            {"$set": {"status": "sold", "bidder_user_id": buyer_user_id, "org_id": buyer_org_id}},
        )
        if mkt_result.matched_count == 0:
            raise RuntimeError("marketplace_commit_listing_not_found")
        return True

    async def _resolve_or_create_buyer_org_id(self, *, buyer_user_id: str, now: datetime) -> str:
        memberships = await self._db["org_memberships"].find(
            {"user_id": buyer_user_id, "status": "active"}
        ).to_list(length=200)
        if memberships:
            # Stable preference: oldest active org membership.
            memberships.sort(key=lambda row: row.get("created_at", now))
            org_id = str(memberships[0].get("org_id", "")).strip()
            if org_id:
                return org_id

        org_id = str(uuid4())
        slug = f"ws-{uuid4().hex[:10]}"
        org_doc = {
            "_id": org_id,
            "slug": slug,
            "name": f"Workspace {buyer_user_id[:8]}",
            "is_active": True,
            "created_at": now,
            "updated_at": now,
        }
        await self._db["orgs"].insert_one(org_doc)
        await self._db["org_memberships"].update_one(
            {"org_id": org_id, "user_id": buyer_user_id},
            {
                "$set": {"status": "active", "updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        await self._db["role_bindings"].update_one(
            {
                "org_id": org_id,
                "subject_user_id": buyer_user_id,
                "role_key": "org_owner",
                "scope_type": "org",
                "scope_id": org_id,
            },
            {
                "$set": {"updated_at": now},
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )
        return org_id

    async def shortlist_offer(self, *, org_id: str, offer_id: str, listing_id: str, bidder_user_id: str) -> bool:
        now = datetime.now(UTC)
        await self._db["school_offers"].update_many(
            {
                "org_id": org_id,
                "listing_id": listing_id,
                "_id": {"$ne": offer_id},
                "offer_kind": "marketplace_transfer",
                "shortlisted": True,
            },
            {"$set": {"shortlisted": False, "updated_at": now}},
        )
        selected = await self._db["school_offers"].update_one(
            {"_id": offer_id, "org_id": org_id},
            {"$set": {"shortlisted": True, "updated_at": now}},
        )
        if selected.matched_count == 0:
            return False
        await self.set_marketplace_status(
            org_id=org_id,
            listing_id=listing_id,
            status="under_offer",
            bidder_user_id=bidder_user_id,
        )
        return True

    async def find_shortlisted_offer_for_listing(self, *, org_id: str, listing_id: str) -> dict[str, Any] | None:
        return await self._db["school_offers"].find_one(
            {
                "org_id": org_id,
                "listing_id": listing_id,
                "offer_kind": "marketplace_transfer",
                "shortlisted": True,
                "status": {"$in": ["requested", "amendment"]},
            }
        )

    async def unshortlist_offer(self, *, org_id: str, offer_id: str, listing_id: str) -> bool:
        now = datetime.now(UTC)
        updated = await self._db["school_offers"].update_one(
            {"_id": offer_id, "org_id": org_id},
            {"$set": {"shortlisted": False, "updated_at": now}},
        )
        if updated.matched_count == 0:
            return False
        await self.set_marketplace_status(org_id=org_id, listing_id=listing_id, status="active", bidder_user_id="")
        return True

    async def find_user_id_by_email(self, *, email: str) -> str | None:
        normalized = email.strip().lower()
        if not normalized:
            return None
        user = await self._db["users"].find_one({"email_normalized": normalized}, {"_id": 1})
        if user is None:
            return None
        return str(user["_id"])

    async def find_user_email_by_user_id(self, *, user_id: str) -> str | None:
        user = await self._db["users"].find_one({"_id": user_id}, {"email": 1})
        if user is None:
            return None
        email = user.get("email")
        if not isinstance(email, str) or not email.strip():
            return None
        return email.strip().lower()

    async def find_offer(self, *, org_id: str, offer_id: str) -> dict[str, Any] | None:
        return await self._db["school_offers"].find_one({"_id": offer_id, "org_id": org_id})

    async def find_offer_by_id(self, *, offer_id: str) -> dict[str, Any] | None:
        return await self._db["school_offers"].find_one({"_id": offer_id})

    async def find_active_marketplace_offer_for_sender(
        self,
        *,
        org_id: str,
        listing_id: str,
        sender_user_id: str,
    ) -> dict[str, Any] | None:
        return await self._db["school_offers"].find_one(
            {
                "org_id": org_id,
                "listing_id": listing_id,
                "sender_user_id": sender_user_id,
                "offer_kind": "marketplace_transfer",
                "status": {"$in": ["requested", "amendment"]},
            }
        )

    async def find_school(self, *, org_id: str, school_id: str) -> dict[str, Any] | None:
        return await self._db["schools"].find_one({"_id": school_id, "org_id": org_id})

    async def find_school_by_id(self, school_id: str) -> dict[str, Any] | None:
        return await self._db["schools"].find_one({"_id": school_id})

    async def list_schools_created_by_user(self, *, user_id: str) -> list[dict[str, Any]]:
        cursor = self._db["schools"].find({"created_by_user_id": user_id})
        return await cursor.to_list(length=500)

    async def upsert_school_membership(
        self,
        *,
        user_id: str,
        school_id: str,
        org_id: str,
        role_keys: list[str],
        status: str = "active",
    ) -> None:
        now = datetime.now(UTC)
        await self._db["school_memberships"].update_one(
            {"user_id": user_id, "school_id": school_id},
            {
                "$set": {
                    "org_id": org_id,
                    "role_keys": role_keys,
                    "status": status,
                    "updated_at": now,
                },
                "$setOnInsert": {"created_at": now},
            },
            upsert=True,
        )

    async def list_school_memberships_for_user(self, *, user_id: str) -> list[dict[str, Any]]:
        cursor = self._db["school_memberships"].find({"user_id": user_id, "status": "active"})
        return await cursor.to_list(length=500)

    async def deactivate_school_memberships(self, *, school_id: str) -> int:
        now = datetime.now(UTC)
        result = await self._db["school_memberships"].update_many(
            {"school_id": school_id, "status": "active"},
            {"$set": {"status": "inactive", "updated_at": now}},
        )
        return int(result.modified_count)


def _slugify(value: str) -> str:
    cleaned = "".join(c.lower() if c.isalnum() else "-" for c in value.strip())
    compact = "-".join(part for part in cleaned.split("-") if part)
    return compact or f"school-{uuid4().hex[:8]}"

