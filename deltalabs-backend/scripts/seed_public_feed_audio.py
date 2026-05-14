"""Seed public `content_type: audio` rows for the Audio hub (Next.js serves files under `/public`).

Usage (from `deltalabs-backend/`):
    python scripts/seed_public_feed_audio.py
    python scripts/seed_public_feed_audio.py --replace

MongoDB URI and database name are read from the same `.env` as the API (`MONGODB_URI`, `MONGODB_DB_NAME` via `app.core.config`), so you seed the database your running `uvicorn` uses.

Place audio files in the **frontend** repo at:
    `deltalabs-frontend/public/mock-feed-audio/`
Filenames must match `AUDIO_ROWS` below (or edit this script when you rename files).
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

# Each row: public URL path under Next `public/` (same filenames as on disk), caption, tags, tone, duration (s).
AUDIO_ROWS: tuple[dict[str, Any], ...] = (
    {
        "src": "/mock-feed-audio/apalonbeats-educational-presentation-tutorial-music-491426.mp3",
        "caption": "Presentation & tutorial — educational bed",
        "hashtags": ["Study", "Presentation", "DeltaLabs"],
        "pdf_label": "Notes (PDF)",
        "media_tone": 0,
        "duration_s": 240,
    },
    {
        "src": "/mock-feed-audio/delosound-educational-education-school-music-432203.mp3",
        "caption": "Education & school — focus loop",
        "hashtags": ["School", "Education", "DeltaLabs"],
        "pdf_label": "Session outline (PDF)",
        "media_tone": 1,
        "duration_s": 200,
    },
    {
        "src": "/mock-feed-audio/hitslab-education-school-educational-music-433906.mp3",
        "caption": "School day study — light educational groove",
        "hashtags": ["School", "Study", "DeltaLabs"],
        "pdf_label": "Lab notes (PDF)",
        "media_tone": 2,
        "duration_s": 220,
    },
    {
        "src": "/mock-feed-audio/hitslab-learning-study-educational-music-459481.mp3",
        "caption": "Learning & study — steady concentration",
        "hashtags": ["Learning", "Focus", "DeltaLabs"],
        "pdf_label": "Reading list (PDF)",
        "media_tone": 3,
        "duration_s": 260,
    },
    {
        "src": "/mock-feed-audio/ikoliks_aj-educational-school-education-music-400869.mp3",
        "caption": "School education — calm classroom ambience",
        "hashtags": ["Classroom", "Education", "DeltaLabs"],
        "pdf_label": "Syllabus ref (PDF)",
        "media_tone": 4,
        "duration_s": 210,
    },
    {
        "src": "/mock-feed-audio/krasnoshchok-educational-educational-learning-study-music-409483.mp3",
        "caption": "Learning study session — minimal pulse",
        "hashtags": ["Study", "Lab", "DeltaLabs"],
        "pdf_label": "Checklist (PDF)",
        "media_tone": 5,
        "duration_s": 280,
    },
    {
        "src": "/mock-feed-audio/leberch-education-documentary-510725.mp3",
        "caption": "Education documentary — narrative underscore",
        "hashtags": ["Documentary", "Research", "DeltaLabs"],
        "pdf_label": "Sources (PDF)",
        "media_tone": 0,
        "duration_s": 320,
    },
    {
        "src": "/mock-feed-audio/mondamusic-educational-education-school-music-499164.mp3",
        "caption": "Education & school — warm pads",
        "hashtags": ["School", "Ambient", "DeltaLabs"],
        "pdf_label": "Handout (PDF)",
        "media_tone": 1,
        "duration_s": 230,
    },
    {
        "src": "/mock-feed-audio/mondamusic-educational-presentation-tutorial-music-491691.mp3",
        "caption": "Tutorial walkthrough — clear progression",
        "hashtags": ["Tutorial", "Presentation", "DeltaLabs"],
        "pdf_label": "Slides ref (PDF)",
        "media_tone": 2,
        "duration_s": 250,
    },
    {
        "src": "/mock-feed-audio/positive_sound-educational-494789.mp3",
        "caption": "Positive educational — upbeat focus",
        "hashtags": ["Motivation", "Study", "DeltaLabs"],
        "pdf_label": "Worksheet (PDF)",
        "media_tone": 3,
        "duration_s": 190,
    },
    {
        "src": "/mock-feed-audio/sigmamusicart-background-educational-environment-music-369011.mp3",
        "caption": "Educational environment — soft background",
        "hashtags": ["Environment", "Background", "DeltaLabs"],
        "pdf_label": "Field log (PDF)",
        "media_tone": 4,
        "duration_s": 300,
    },
    {
        "src": "/mock-feed-audio/starostin-educational-educational-education-school-music-263145.mp3",
        "caption": "Education school — gentle study theme",
        "hashtags": ["School", "Calm", "DeltaLabs"],
        "pdf_label": "Glossary (PDF)",
        "media_tone": 5,
        "duration_s": 270,
    },
)


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Seed backend audio content_items.")
    parser.add_argument(
        "--replace",
        action="store_true",
        help="Delete previously seeded school-debug-audio-* rows before re-seeding.",
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
            collection.delete_many({"_id": {"$regex": r"^school-debug-audio-"}})

        now = datetime.now(UTC)
        upserts = 0
        for idx, row in enumerate(AUDIO_ROWS, start=1):
            item_id = f"school-debug-audio-{idx:02d}"
            doc = {
                "_id": item_id,
                "visibility": "public",
                "content_type": "audio",
                "created_at": now,
                "updated_at": now,
                "duration_s": int(row["duration_s"]),
                "course_category": ("research", "lab", "course")[(idx - 1) % 3],
                "video_src": row["src"],
                "media_tone": row["media_tone"],
                "caption": row["caption"],
                "hashtags": row["hashtags"],
                "pdf_label": row["pdf_label"],
                "like_count": "0",
            }
            result = collection.update_one({"_id": item_id}, {"$set": doc}, upsert=True)
            if result.upserted_id is not None or result.modified_count > 0:
                upserts += 1

        n = len(AUDIO_ROWS)
        print(f"Audio seed complete. Touched {n} rows, changed {upserts}.")
        print(f"IDs: school-debug-audio-01 … school-debug-audio-{n:02d}")
        print("Paths must exist under deltalabs-frontend/public/mock-feed-audio/ (see README).")
    finally:
        client.close()


if __name__ == "__main__":
    main()
