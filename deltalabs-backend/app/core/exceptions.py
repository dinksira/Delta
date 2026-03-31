"""Domain-oriented exceptions; HTTP mapping is added in a later phase."""

from __future__ import annotations

from typing import Any, ClassVar


class DeltaLabsBaseError(Exception):
    """Base error for Delta Labs domains and services."""

    default_code: ClassVar[str] = "delta_labs_error"

    def __init__(
        self,
        message: str,
        *,
        code: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code if code is not None else self.default_code
        self.details = details


class NotFoundError(DeltaLabsBaseError):
    """Resource or entity was not found (maps to 404 in the HTTP layer)."""

    default_code: ClassVar[str] = "not_found"


class ConflictError(DeltaLabsBaseError):
    """State conflict, e.g. duplicate or version mismatch (maps to 409)."""

    default_code: ClassVar[str] = "conflict"


class ValidationError(DeltaLabsBaseError):
    """Business or domain validation failed (maps to 400).

    Not the same as Pydantic's request body ``ValidationError`` used by FastAPI.
    """

    default_code: ClassVar[str] = "validation_error"
