"""Identity repository (MongoDB access)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING

from app.domain.identity.schemas import UserRecord


class Repository:
    """MongoDB access layer for identity/session entities."""

    # ################################ REPOSITORY ################################
    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ping(self) -> bool:
        """Connectivity check used by tests and health diagnostics."""
        return True

    async def ensure_indexes(self) -> None:
        """Create identity indexes required by P1."""
        await self._db["users"].create_index([("username_normalized", ASCENDING)], unique=True)
        await self._ensure_optional_unique_string_index(
            collection_name="users",
            field_name="email_normalized",
        )
        await self._ensure_optional_unique_string_index(
            collection_name="users",
            field_name="phone_e164",
        )
        await self._db["user_sessions"].create_index([("token_hash", ASCENDING)], unique=True)
        await self._db["user_sessions"].create_index(
            [("expires_at", ASCENDING)],
            expireAfterSeconds=0,
        )

    async def _ensure_optional_unique_string_index(
        self,
        *,
        collection_name: str,
        field_name: str,
    ) -> None:
        """Ensure unique index that ignores null/missing values for optional fields."""
        collection = self._db[collection_name]
        index_name = f"{field_name}_1"
        info = await collection.index_information()
        existing = info.get(index_name)
        if existing is not None:
            partial = existing.get("partialFilterExpression")
            if partial != {field_name: {"$type": "string"}}:
                await collection.drop_index(index_name)
        await collection.create_index(
            [(field_name, ASCENDING)],
            name=index_name,
            unique=True,
            partialFilterExpression={field_name: {"$type": "string"}},
        )

    async def find_user_by_identity(self, identity_raw: str) -> UserRecord | None:
        """Lookup user by username/email/phone normalized forms."""
        normalized = identity_raw.strip().lower()
        doc = await self._db["users"].find_one(
            {
                "$or": [
                    {"username_normalized": normalized},
                    {"email_normalized": normalized},
                    {"phone_e164": identity_raw.strip()},
                ]
            }
        )
        if doc is None:
            return None
        return self._to_user_record(doc)

    async def create_user_with_password(
        self,
        *,
        username: str,
        email: str | None,
        phone_e164: str | None,
        password_hash: str,
    ) -> UserRecord:
        now = datetime.now(UTC)
        user_id = str(uuid4())
        document: dict[str, Any] = {
            "_id": user_id,
            "username": username,
            "username_normalized": username.strip().lower(),
            "email": email,
            "email_normalized": email.strip().lower() if email is not None else None,
            "phone_e164": phone_e164,
            "is_active": True,
            "is_verified": False,
            "created_at": now,
            "updated_at": now,
            "password_hash": password_hash,
        }
        await self._db["users"].insert_one(document)
        return self._to_user_record(document)

    async def create_session(
        self,
        *,
        user_id: str,
        token_hash: str,
        ttl_minutes: int,
    ) -> dict[str, Any]:
        now = datetime.now(UTC)
        expires_at = now + timedelta(minutes=ttl_minutes)
        session_id = str(uuid4())
        document: dict[str, Any] = {
            "_id": session_id,
            "user_id": user_id,
            "token_hash": token_hash,
            "created_at": now,
            "expires_at": expires_at,
            "revoked_at": None,
        }
        await self._db["user_sessions"].insert_one(document)
        return document

    async def find_session_by_token_hash(self, token_hash: str) -> dict[str, Any] | None:
        now = datetime.now(UTC)
        return await self._db["user_sessions"].find_one(
            {
                "token_hash": token_hash,
                "revoked_at": None,
                "expires_at": {"$gt": now},
            }
        )

    async def revoke_session(self, token_hash: str) -> bool:
        now = datetime.now(UTC)
        result = await self._db["user_sessions"].update_one(
            {"token_hash": token_hash, "revoked_at": None},
            {"$set": {"revoked_at": now}},
        )
        return result.modified_count > 0

    async def revoke_all_sessions_for_user(self, user_id: str) -> int:
        now = datetime.now(UTC)
        result = await self._db["user_sessions"].update_many(
            {"user_id": user_id, "revoked_at": None},
            {"$set": {"revoked_at": now}},
        )
        return int(result.modified_count)

    async def update_password_hash(self, user_id: str, password_hash: str) -> bool:
        now = datetime.now(UTC)
        result = await self._db["users"].update_one(
            {"_id": user_id},
            {
                "$set": {
                    "password_hash": password_hash,
                    "updated_at": now,
                }
            },
        )
        return result.modified_count > 0

    async def find_user_by_id(self, user_id: str) -> UserRecord | None:
        doc = await self._db["users"].find_one({"_id": user_id})
        if doc is None:
            return None
        return self._to_user_record(doc)

    @staticmethod
    def _to_user_record(doc: dict[str, Any]) -> UserRecord:
        return UserRecord(
            id=str(doc["_id"]),
            username=str(doc["username"]),
            username_normalized=str(doc["username_normalized"]),
            email=doc.get("email"),
            email_normalized=doc.get("email_normalized"),
            phone_e164=doc.get("phone_e164"),
            is_active=bool(doc.get("is_active", True)),
            is_verified=bool(doc.get("is_verified", False)),
            created_at=doc["created_at"],
            updated_at=doc["updated_at"],
            password_hash=str(doc["password_hash"]),
        )


# ################################ /REPOSITORY ################################
