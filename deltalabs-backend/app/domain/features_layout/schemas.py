"""Schemas for per-user Features page layout (order + hidden cards)."""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class FeaturesLayoutUpsertRequest(BaseModel):
    """Client payload to persist a user's feature card arrangement."""

    model_config = ConfigDict(extra="forbid")

    order_keys: list[str] = Field(default_factory=list, max_length=64)
    hidden_keys: list[str] = Field(default_factory=list, max_length=64)
    labels: dict[str, str] = Field(default_factory=dict)


class FeaturesLayoutResponse(BaseModel):
    """Stored layout returned to the client."""

    model_config = ConfigDict(populate_by_name=True)

    order_keys: list[str] = Field(default_factory=list, serialization_alias="orderKeys")
    hidden_keys: list[str] = Field(default_factory=list, serialization_alias="hiddenKeys")
    labels: dict[str, str] = Field(default_factory=dict, serialization_alias="labels")
    updated_at: datetime = Field(serialization_alias="updatedAt")
