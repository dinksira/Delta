"""Seed real backend feed rows from frontend public mock videos.

Usage (from `deltalabs-backend/`):
    python scripts/seed_public_feed_videos.py
    python scripts/seed_public_feed_videos.py --replace

MongoDB URI and database name are read from the same `.env` as the API (`MONGODB_URI`, `MONGODB_DB_NAME`).

This creates `content_items` documents that behave like normal posted videos,
so likes/comments/saves/shares persist through the real backend APIs.
"""

from __future__ import annotations

import argparse
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from pymongo import MongoClient

_BACKEND_ROOT = Path(__file__).resolve().parent.parent
if str(_BACKEND_ROOT) not in sys.path:
    sys.path.insert(0, str(_BACKEND_ROOT))

from app.core.config import get_settings

VIDEO_ROWS: tuple[dict[str, Any], ...] = (
    {
        "caption": "Analyzing the neural pathways of synthetically grown bio-neural chips.",
        "hashtags": ["NeuroTech", "FutureTech", "DeltaLabs"],
        "pdf_label": "Access Full Research Paper (PDF)",
        "media_tone": 0,
    },
    {
        "caption": "Lab notes: closed-loop stimulation protocols on organoid arrays.",
        "hashtags": ["BioEng", "Research", "DeltaLabs"],
        "pdf_label": "View lab summary (PDF)",
        "media_tone": 1,
    },
    {
        "caption": "Dataset walkthrough — multimodal sensing fusion for edge devices.",
        "hashtags": ["EdgeAI", "Sensors", "DeltaLabs"],
        "pdf_label": "Download dataset card (PDF)",
        "media_tone": 2,
    },
    {
        "caption": "Simulation run #482: failure modes in redundant actuator meshes.",
        "hashtags": ["Simulation", "Robotics", "DeltaLabs"],
        "pdf_label": "Open simulation report (PDF)",
        "media_tone": 3,
    },
    {
        "caption": "Short brief on ethics review for autonomous lab assistants.",
        "hashtags": ["Policy", "AI", "DeltaLabs"],
        "pdf_label": "Read ethics brief (PDF)",
        "media_tone": 4,
    },
    {
        "caption": "Field test highlights — low-latency streaming from remote sites.",
        "hashtags": ["Streaming", "FieldTest", "DeltaLabs"],
        "pdf_label": "Field test appendix (PDF)",
        "media_tone": 5,
    },
    {
        "caption": "On-site model validation with instrumented mobile rigs.",
        "hashtags": ["Validation", "MobileLab", "DeltaLabs"],
        "pdf_label": "Review validation notes (PDF)",
        "media_tone": 1,
    },
    {
        "caption": "Prototype sprint: robust control loops in noisy environments.",
        "hashtags": ["Control", "Prototype", "DeltaLabs"],
        "pdf_label": "Open sprint brief (PDF)",
        "media_tone": 2,
    },
    {
        "caption": "Weekly recap from the autonomous systems research floor.",
        "hashtags": ["Recap", "Autonomy", "DeltaLabs"],
        "pdf_label": "Read weekly recap (PDF)",
        "media_tone": 0,
    },
    {
        "caption": "High-intensity replay clip captured from field telemetry broadcast.",
        "hashtags": ["Replay", "SportsAI", "DeltaLabs"],
        "pdf_label": "Open replay notes (PDF)",
        "media_tone": 4,
    },
    {
        "caption": "Mountain path capture with stabilization benchmark annotations.",
        "hashtags": ["Outdoors", "Stabilization", "DeltaLabs"],
        "pdf_label": "View benchmark notes (PDF)",
        "media_tone": 2,
    },
    {
        "caption": "Classic highlight sequence used for motion model evaluation.",
        "hashtags": ["Highlights", "Motion", "DeltaLabs"],
        "pdf_label": "Inspect model metrics (PDF)",
        "media_tone": 3,
    },
    {
        "caption": "Creative vertical cut prepared for template quality checks.",
        "hashtags": ["Template", "Creative", "DeltaLabs"],
        "pdf_label": "Review template report (PDF)",
        "media_tone": 1,
    },
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed backend content_items from public mock videos.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete previously seeded debug-school videos before re-seeding.",
    )
    return parser.parse_args()


def main() -> None:
    args = _parse_args()
    settings = get_settings()
    client = MongoClient(settings.mongodb_uri)
    db = client[settings.mongodb_db_name]
    collection = db["content_items"]

    try:
        if args.replace:
            collection.delete_many({"_id": {"$regex": r"^school-debug-video-\d+$"}})

        now = datetime.now(UTC)
        upserts = 0
        for idx, row in enumerate(VIDEO_ROWS, start=1):
            item_id = f"school-debug-video-{idx:02d}"
            doc = {
                "_id": item_id,
                "visibility": "public",
                "content_type": "video",
                "created_at": now,
                "updated_at": now,
                # Public Next.js static path served by frontend dev/prod app.
                "video_src": f"/mock-feed-videos/video-{idx:02d}.mp4",
                "media_tone": row["media_tone"],
                "caption": row["caption"],
                "hashtags": row["hashtags"],
                "pdf_label": row["pdf_label"],
                "like_count": "0",
            }
            result = collection.update_one({"_id": item_id}, {"$set": doc}, upsert=True)
            if result.upserted_id is not None or result.modified_count > 0:
                upserts += 1

        print(f"Seed complete. Touched {len(VIDEO_ROWS)} feed rows, changed {upserts}.")
        print("IDs: school-debug-video-01 ... school-debug-video-13")
    finally:
        client.close()


if __name__ == "__main__":
    main()
