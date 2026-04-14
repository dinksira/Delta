"""Assign system_admin role to an existing user."""

from __future__ import annotations

import argparse
import asyncio

from app.core.config import get_settings
from app.domain.authorization.repository import Repository
from app.domain.authorization.service import Service
from motor.motor_asyncio import AsyncIOMotorClient


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Assign system_admin role to an existing user")
    parser.add_argument("--email", type=str, help="User email used during signup")
    parser.add_argument("--user-id", type=str, help="User id from users collection (_id)")
    args = parser.parse_args()
    if not args.email and not args.user_id:
        parser.error("Provide either --email or --user-id.")
    return args


async def main() -> int:
    args = _parse_args()
    settings = get_settings()
    client = AsyncIOMotorClient(
        settings.mongodb_uri,
        maxPoolSize=settings.mongodb_max_pool_size,
        minPoolSize=settings.mongodb_min_pool_size,
        serverSelectionTimeoutMS=settings.mongodb_server_selection_timeout_ms,
    )
    db = client[settings.mongodb_db_name]
    authz_repo = Repository(db)
    authz_service = Service(authz_repo)

    await authz_service.bootstrap_defaults()
    default_org = await authz_repo.find_org_by_slug(settings.authz_default_org_slug)
    if default_org is None:
        print("Error: default/system org not found.")
        client.close()
        return 1
    system_org_id = str(default_org["_id"])

    user_doc = None
    if args.user_id:
        user_doc = await db["users"].find_one({"_id": args.user_id})
    elif args.email:
        user_doc = await db["users"].find_one({"email_normalized": args.email.strip().lower()})
        if user_doc is None:
            user_doc = await db["users"].find_one({"email": args.email.strip()})

    if user_doc is None:
        print("Error: user not found. Verify the email/user id exists in users collection.")
        client.close()
        return 1

    user_id = str(user_doc["_id"])
    await authz_repo.upsert_membership(org_id=system_org_id, user_id=user_id, status="active")
    await authz_repo.upsert_role_binding(
        org_id=system_org_id,
        user_id=user_id,
        role_key="system_admin",
        scope_type="org",
        scope_id=system_org_id,
    )
    print(f"Assigned system_admin to user_id={user_id} in org_id={system_org_id}")
    client.close()
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
