"""content service placeholders."""

from app.domain.content.repository import Repository


class Service:
    """Business logic layer placeholder for the content domain."""

    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Placeholder service method used by foundation tests."""
        return await self._repository.ping()
