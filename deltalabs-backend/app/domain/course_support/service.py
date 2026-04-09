"""course_support service placeholders."""

from app.domain.course_support.repository import Repository


class Service:
    """Business logic layer placeholder for the course_support domain."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()


# ################################ /SERVICE ################################
