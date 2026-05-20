"""Service layer for per-user Features layout."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.domain.features_layout.repository import Repository
from app.domain.features_layout.schemas import FeaturesLayoutResponse


class Service:
    def __init__(self, repo: Repository) -> None:
        self._repo = repo

    async def bootstrap(self) -> None:
        await self._repo.ensure_indexes()

    async def get_layout(self, *, user_id: str) -> FeaturesLayoutResponse:
        await self.bootstrap()
        doc = await self._repo.find_by_user_id(user_id=user_id)
        if doc is None:
            return FeaturesLayoutResponse(order_keys=[], hidden_keys=[], labels={}, updated_at=datetime.fromtimestamp(0))
        return FeaturesLayoutResponse(
            order_keys=list(doc.get("order_keys") or []),
            hidden_keys=list(doc.get("hidden_keys") or []),
            labels=dict(doc.get("labels") or {}),
            updated_at=doc.get("updated_at"),
        )

    async def upsert_layout(
        self,
        *,
        user_id: str,
        order_keys: list[str],
        hidden_keys: list[str],
        labels: dict[str, str],
        allowed_keys: set[str],
    ) -> FeaturesLayoutResponse:
        await self.bootstrap()
        # Remove unknown / unauthorized keys, preserve order.
        clean_order: list[str] = []
        seen: set[str] = set()
        for k in order_keys:
            if k in allowed_keys and k not in seen:
                clean_order.append(k)
                seen.add(k)
        clean_hidden = sorted({k for k in hidden_keys if k in allowed_keys})
        clean_labels: dict[str, str] = {}
        for k, v in (labels or {}).items():
            if k not in allowed_keys:
                continue
            name = (v or "").strip()
            if not name:
                continue
            clean_labels[k] = name[:32]

        stored = await self._repo.upsert(
            user_id=user_id,
            order_keys=clean_order,
            hidden_keys=clean_hidden,
            labels=clean_labels,
        )
        return FeaturesLayoutResponse(
            order_keys=list(stored.get("order_keys") or []),
            hidden_keys=list(stored.get("hidden_keys") or []),
            labels=dict(stored.get("labels") or {}),
            updated_at=stored.get("updated_at"),
        )

