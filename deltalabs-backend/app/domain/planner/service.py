"""planner service placeholders."""

from app.domain.planner.repository import Repository


class Service:
    """Business logic layer placeholder for the planner domain."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()


# ################################ /SERVICE ################################
