"""content domain schemas (foundation placeholders)."""

from pydantic import BaseModel


class DomainEntity(BaseModel):
    """Placeholder entity model for the content domain."""

    id: str
