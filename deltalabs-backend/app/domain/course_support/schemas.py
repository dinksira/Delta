"""course_support domain schemas (foundation placeholders)."""

from pydantic import BaseModel


class DomainEntity(BaseModel):
    """Placeholder entity model for the course_support domain."""

    id: str
