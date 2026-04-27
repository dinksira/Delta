"""rent_lab service placeholders."""

from app.domain.rent_lab.repository import Repository


class Service:
    """Business logic layer placeholder for the rent_lab domain."""

    # ################################ SERVICE ################################
    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()


# ################################ /SERVICE ################################
