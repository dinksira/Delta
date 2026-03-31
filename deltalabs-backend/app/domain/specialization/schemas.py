"""specialization domain schemas (foundation placeholders)."""

from pydantic import BaseModel


class DomainEntity(BaseModel):
    """Placeholder entity model for the specialization domain."""

    id: str
