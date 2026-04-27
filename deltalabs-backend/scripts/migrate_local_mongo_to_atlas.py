"""Migrate local MongoDB data into the configured Atlas database.

Usage:
    python scripts/migrate_local_mongo_to_atlas.py
    python scripts/migrate_local_mongo_to_atlas.py --local-uri mongodb://localhost:27017
    python scripts/migrate_local_mongo_to_atlas.py --wipe-target
"""

from __future__ import annotations

import argparse
from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from pymongo import MongoClient, ReplaceOne
from pymongo.collection import Collection

from app.core.config import get_settings


@dataclass(frozen=True)
class CollectionResult:
    """Per-collection migration summary."""

    name: str
    source_count: int
    target_count: int
    inserted_or_replaced: int


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Copy all documents and indexes from local MongoDB into Atlas.",
    )
    parser.add_argument(
        "--local-uri",
        default="mongodb://localhost:27017",
        help="Source MongoDB URI (default: mongodb://localhost:27017).",
    )
    parser.add_argument(
        "--source-db-name",
        default=None,
        help="Source DB name (default: uses MONGODB_DB_NAME).",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=500,
        help="Bulk upsert batch size (default: 500).",
    )
    parser.add_argument(
        "--wipe-target",
        action="store_true",
        help="Drop each target collection before inserting data.",
    )
    return parser.parse_args()


def _iter_batches(items: Iterable[dict[str, Any]], batch_size: int) -> Iterable[list[dict[str, Any]]]:
    batch: list[dict[str, Any]] = []
    for item in items:
        batch.append(item)
        if len(batch) >= batch_size:
            yield batch
            batch = []
    if batch:
        yield batch


def _copy_indexes(source: Collection[dict[str, Any]], target: Collection[dict[str, Any]]) -> None:
    for name, info in source.index_information().items():
        if name == "_id_":
            continue
        keys = info.get("key")
        if not keys:
            continue
        kwargs: dict[str, Any] = {"name": name}
        for option in (
            "unique",
            "sparse",
            "expireAfterSeconds",
            "partialFilterExpression",
            "collation",
        ):
            if option in info:
                kwargs[option] = info[option]
        target.create_index(keys, **kwargs)


def _migrate_collection(
    source_col: Collection[dict[str, Any]],
    target_col: Collection[dict[str, Any]],
    *,
    batch_size: int,
    wipe_target: bool,
) -> CollectionResult:
    source_count = source_col.count_documents({})
    if wipe_target:
        target_col.drop()

    inserted_or_replaced = 0
    cursor = source_col.find({})
    try:
        for batch in _iter_batches(cursor, batch_size=batch_size):
            operations = [ReplaceOne({"_id": doc["_id"]}, doc, upsert=True) for doc in batch]
            result = target_col.bulk_write(operations, ordered=False)
            inserted_or_replaced += (
                result.upserted_count + result.modified_count + result.matched_count
            )
    finally:
        cursor.close()

    _copy_indexes(source_col, target_col)
    target_count = target_col.count_documents({})
    return CollectionResult(
        name=source_col.name,
        source_count=source_count,
        target_count=target_count,
        inserted_or_replaced=inserted_or_replaced,
    )


def main() -> None:
    args = _parse_args()
    settings = get_settings()
    source_db_name = args.source_db_name or settings.mongodb_db_name

    source_client = MongoClient(args.local_uri)
    target_client = MongoClient(settings.mongodb_uri)
    try:
        source_db = source_client[source_db_name]
        target_db = target_client[settings.mongodb_db_name]
        collection_names = source_db.list_collection_names()
        if not collection_names:
            print(f"No collections found in source DB '{source_db_name}'. Nothing to migrate.")
            return

        results: list[CollectionResult] = []
        print(
            f"Migrating {len(collection_names)} collections from '{source_db_name}' "
            f"to Atlas DB '{settings.mongodb_db_name}'..."
        )
        for name in collection_names:
            source_col = source_db[name]
            target_col = target_db[name]
            result = _migrate_collection(
                source_col,
                target_col,
                batch_size=args.batch_size,
                wipe_target=args.wipe_target,
            )
            results.append(result)
            print(
                f"[{name}] source={result.source_count}, "
                f"target={result.target_count}, touched={result.inserted_or_replaced}"
            )

        source_total = sum(item.source_count for item in results)
        target_total = sum(item.target_count for item in results)
        print("Migration complete.")
        print(f"Total source docs: {source_total}")
        print(f"Total target docs: {target_total}")
        if not args.wipe_target:
            print(
                "Note: target was not wiped before migration. "
                "Run with --wipe-target if you want exact mirror behavior."
            )
    finally:
        source_client.close()
        target_client.close()


if __name__ == "__main__":
    main()
