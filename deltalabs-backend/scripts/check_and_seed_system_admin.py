"""Check role definitions and seed missing admin roles."""

from __future__ import annotations

import asyncio

from app.core.config import get_settings
from app.domain.authorization.repository import Repository
from app.domain.authorization.service import Service
from motor.motor_asyncio import AsyncIOMotorClient


async def main() -> None:
    settings = get_settings()
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=settings.mongodb_max_pool_size,
        minPoolSize=settings.mongodb_min_pool_size,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
    )
    db = client[settings.mongodb_db_name]
    authz = Service(Repository(db))

    # Ensures role_definitions contain all default roles (including system_admin).
    await authz.bootstrap_defaults()

    docs = await db["role_definitions"].find(
        {"role_key": {"$in": ["system_admin", "org_owner", "org_admin"]}}
    ).to_list(length=20)
    found_roles = sorted(str(doc.get("role_key")) for doc in docs)
    binding_count = await db["role_bindings"].count_documents({"role_key": "system_admin"})
    print("found_roles:", found_roles)
    print("system_admin_exists:", "system_admin" in found_roles)
    print("system_admin_bindings:", binding_count)
    client.close()


if __name__ == "__main__":
    asyncio.run(main())
