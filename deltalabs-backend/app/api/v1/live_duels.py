"""Live Duel HTTP + WebSocket endpoints.

Lobby gets the demo catalog merged with host-created rooms persisted in Mongo.
Created rooms run a realtime Redis Pub/Sub channel (`live_duel:{room_id}`) that
the WebSocket fans out to every client in the room as reducer-shaped events
(`POST_LIVE_QUESTION`, `APPEND_CHAT_MESSAGE`, …) so the frontend dispatches them
directly into its `LiveDuelContext` without changing the view layer.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.api.deps import (
    CurrentUser,
    get_current_user,
    get_current_user_optional,
    get_db,
    get_redis,
)
from app.compat.redis_typing import AsyncRedis
from app.core.config import get_settings
from app.core.security import hash_session_token
from app.domain.identity.repository import Repository as IdentityRepository
from app.domain.live_duels import queue as live_duels_queue
from app.domain.live_duels.repository import Repository as LiveDuelRepository
from app.domain.live_duels.schemas import (
    LiveDuelChatRequest,
    LiveDuelCreateRequest,
    LiveDuelQuestionRequest,
)

router = APIRouter(prefix="/live-duels", tags=["live-duels"])

logger = logging.getLogger("deltalabs.live_duels.api")

# ################################ DEMO CATALOG ################################
# Mirrors the frontend lobby (same ids) so a solo demo room still resolves.
DEMO_LIVE_DUELS: list[dict[str, Any]] = [
    {
        "id": "live-geo-001",
        "title": "World Geography Showdown",
        "subject": "Geography",
        "difficulty": "Medium",
        "status": "live",
        "hostName": "Dr. Sarah Martinez",
        "hostAvatarUrl": None,
        "viewers": 1247,
        "playersJoined": 8,
        "playersMax": 20,
        "entryFee": "Free",
        "prizePool": "10,000 ETB",
        "durationLabel": "10 rounds",
        "hostIsUser": False,
    },
    {
        "id": "live-math-002",
        "title": "Quick Maths Live Duel",
        "subject": "Mathematics",
        "difficulty": "Easy",
        "status": "open",
        "hostName": "Prof. Elias Novak",
        "hostAvatarUrl": None,
        "viewers": 3,
        "playersJoined": 3,
        "playersMax": 16,
        "entryFee": "50 ETB",
        "prizePool": "5,000 ETB",
        "durationLabel": "60 min",
        "hostIsUser": False,
    },
    {
        "id": "live-code-003",
        "title": "Code Sprint Arena",
        "subject": "Programming",
        "difficulty": "Hard",
        "status": "live",
        "hostName": "Kade Okafor",
        "hostAvatarUrl": None,
        "viewers": 891,
        "playersJoined": 12,
        "playersMax": 24,
        "entryFee": "100 ETB",
        "prizePool": "20,000 ETB",
        "durationLabel": "10 rounds",
        "hostIsUser": False,
    },
    {
        "id": "live-hist-004",
        "title": "History Rapid Fire",
        "subject": "History",
        "difficulty": "Medium",
        "status": "scheduled",
        "hostName": "Zara Hussein",
        "hostAvatarUrl": None,
        "viewers": 0,
        "playersJoined": 0,
        "playersMax": 12,
        "entryFee": "Free",
        "prizePool": "3,000 ETB",
        "scheduledAt": "2026-09-08T18:00:00.000Z",
        "durationLabel": "45 min",
        "hostIsUser": False,
    },
    {
        "id": "live-bio-005",
        "title": "Science Smackdown",
        "subject": "Biology",
        "difficulty": "Medium",
        "status": "open",
        "hostName": "Milo Tran",
        "hostAvatarUrl": None,
        "viewers": 0,
        "playersJoined": 5,
        "playersMax": 18,
        "entryFee": "50 ETB",
        "prizePool": "7,500 ETB",
        "durationLabel": "60 min",
        "hostIsUser": False,
    },
    {
        "id": "live-gen-006",
        "title": "Brain Brawl: Trivia",
        "subject": "General",
        "difficulty": "Easy",
        "status": "live",
        "hostName": "Dinksira Elsa",
        "hostAvatarUrl": None,
        "viewers": 1562,
        "playersJoined": 20,
        "playersMax": 40,
        "entryFee": "Free",
        "prizePool": "15,000 ETB",
        "durationLabel": "10 rounds",
        "hostIsUser": False,
    },
]

DEMO_BY_ID: dict[str, dict[str, Any]] = {entry["id"]: entry for entry in DEMO_LIVE_DUELS}


def _demo_room_detail(entry: dict[str, Any]) -> dict[str, Any]:
    return {
        **entry,
        "hostUserId": None,
        "hasJoined": False,
        "postedQuestions": [],
        "chat": [],
    }


# ################################ HELPERS ################################
async def _authenticate_ws(
    websocket: WebSocket,
    db: AsyncIOMotorDatabase[dict[str, Any]],
) -> Any | None:
    """Validate `access_token` query param like the feed WS (browsers can't send headers)."""
    access_token = (websocket.query_params.get("access_token") or "").strip()
    if not access_token:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing access token.")
        return None
    identity_repository = IdentityRepository(db)
    session_doc = await identity_repository.find_session_by_token_hash(
        hash_session_token(access_token)
    )
    if session_doc is None:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Invalid session.")
        return None
    return session_doc


async def _build_chat_message(
    db: AsyncIOMotorDatabase[dict[str, Any]],
    user_id: str,
    text: str,
    emoji: str | None,
) -> dict[str, Any]:
    identity_repository = IdentityRepository(db)
    user_doc = await identity_repository.find_user_by_id(user_id)
    username = user_doc.username if user_doc else "viewer"
    avatar_url = user_doc.avatar_url if user_doc else None
    return {
        "id": str(ObjectId()),
        "username": username,
        "avatar_url": avatar_url,
        "text": text,
        "emoji": emoji,
        "sent_at": int(time.time() * 1000),
    }


async def _room_participants(
    db: AsyncIOMotorDatabase[dict[str, Any]],
    doc: dict[str, Any],
) -> list[dict[str, Any]]:
    """Resolve the real on-stage roster (host + joined users) with display names.

    Each entry matches the frontend `LiveParticipant` shape so the room can seed
    the participant grid from real accounts instead of mock fillers.
    """
    identity_repository = IdentityRepository(db)
    host_user_id = doc.get("host_user_id")
    joined_ids = [str(user_id) for user_id in doc.get("joined_user_ids", [])]
    ordered_ids: list[str] = []
    if host_user_id:
        ordered_ids.append(str(host_user_id))
    for user_id in joined_ids:
        if user_id not in ordered_ids:
            ordered_ids.append(user_id)

    roster: list[dict[str, Any]] = []
    for user_id in ordered_ids:
        user_doc = await identity_repository.find_user_by_id(user_id)
        roster.append(
            {
                "id": user_id,
                "name": user_doc.username if user_doc else "Player",
                "avatarUrl": user_doc.avatar_url if user_doc else None,
                "isHost": user_id == host_user_id,
            }
        )
    return roster


async def _ws_forward_loop(
    websocket: WebSocket,
    pubsub: Any,
    channel: str,
) -> None:
    while True:
        try:
            message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
        except Exception as exc:
            logger.warning("live_duel.ws.redis_read_failed", extra={"error": str(exc)})
            await websocket.close(
                code=status.WS_1011_INTERNAL_ERROR,
                reason="Realtime backend unavailable.",
            )
            return
        if not message:
            await asyncio.sleep(0.1)
            continue
        raw_data = message.get("data")
        if isinstance(raw_data, bytes):
            raw_data = raw_data.decode("utf-8")
        if not isinstance(raw_data, str) or not raw_data:
            continue
        try:
            payload = json.loads(raw_data)
        except json.JSONDecodeError:
            continue
        if payload.get("room_id") != room_id_from(channel):
            continue
        await websocket.send_json(payload)


def room_id_from(channel: str) -> str:
    return channel.rsplit(":", 1)[-1]


async def _ws_client_loop(
    websocket: WebSocket,
    redis: AsyncRedis,
    db: AsyncIOMotorDatabase[dict[str, Any]],
    room_id: str,
    user_id: str,
) -> None:
    """Accept inbound chat from clients and fan it out to the whole room."""
    while True:
        try:
            raw = await websocket.receive_text()
        except WebSocketDisconnect:
            return
        if not raw:
            continue
        try:
            incoming = json.loads(raw)
        except json.JSONDecodeError:
            continue
        kind = str(incoming.get("kind", ""))
        if kind == "chat":
            message = await _build_chat_message(
                db, user_id, str(incoming.get("text", "")).strip(), incoming.get("emoji")
            )
            if not message["text"]:
                continue
            repository = LiveDuelRepository(db)
            await repository.append_chat(room_id, message)
            pub_payload = {
                "id": message["id"],
                "username": message["username"],
                "avatarUrl": message["avatar_url"],
                "text": message["text"],
                "emoji": message["emoji"],
                "sentAt": message["sent_at"],
            }
            await live_duels_queue.publish_live_duel_update(
                redis,
                room_id=room_id,
                type="APPEND_CHAT_MESSAGE",
                payload=pub_payload,
            )
        elif kind == "media":
            # WebRTC signaling relay: clients push offer/answer/ice/media-state
            # envelopes and every subscriber receives them as `MEDIA_SIGNAL` with
            # the *authenticated* sender stamped on (the room is a broadcast, so
            # receivers filter by `fromUserId` / `toUserId`).
            payload = incoming.get("payload")
            if isinstance(payload, dict):
                payload["fromUserId"] = user_id
                await live_duels_queue.publish_live_duel_update(
                    redis,
                    room_id=room_id,
                    type="MEDIA_SIGNAL",
                    payload=payload,
                )


# ################################ HTTP ################################
@router.get("", response_model=list[dict[str, Any]])
async def list_live_duels(
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> list[dict[str, Any]]:
    """Lobby catalog: host-created rooms first, then the demo list."""
    repository = LiveDuelRepository(db)
    stored = await repository.list_all()
    entries = [LiveDuelRepository.to_entry(doc) for doc in stored]
    return entries + DEMO_LIVE_DUELS


@router.post("", response_model=dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_live_duel(
    payload: LiveDuelCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> dict[str, Any]:
    """Register a new live duel hosted by the current user."""
    repository = LiveDuelRepository(db)
    oid = ObjectId()
    doc = {
        "_id": oid,
        "title": payload.title.strip(),
        "subject": payload.subject,
        "difficulty": payload.difficulty,
        "status": "live",
        "host_name": payload.host_name,
        "host_avatar_url": payload.host_avatar_url,
        "host_user_id": current_user.user_id,
        "viewers": 12,
        "players_joined": 1,
        "players_max": payload.players_max,
        "entry_fee": payload.entry_fee,
        "prize_pool": payload.prize_pool,
        "duration_label": payload.duration_label,
        "joined_user_ids": [current_user.user_id],
        "questions": [],
        "chat": [],
        "created_at": int(time.time()),
    }
    await repository.insert(doc)
    return LiveDuelRepository.to_entry(doc)


@router.get("/{room_id}", response_model=dict[str, Any])
async def get_live_duel(
    room_id: str,
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    current_user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
) -> dict[str, Any]:
    """Room detail: entry + posted questions + chat replay.

    `hostIsUser` is derived from the authenticated requester so the frontend can
    re-derive host mode after a page reload (the in-memory session registry does
    not survive a refresh).
    """
    repository = LiveDuelRepository(db)
    doc = await repository.find_by_id(room_id)
    if doc is not None:
        entry = LiveDuelRepository.to_entry(doc)
        is_host = current_user is not None and doc.get("host_user_id") == current_user.user_id
        return {
            **entry,
            "hostIsUser": is_host,
            "participants": await _room_participants(db, doc),
            "chat": [LiveDuelRepository.to_chat(msg) for msg in reversed(doc.get("chat", []))],
        }
    demo_entry = DEMO_BY_ID.get(room_id)
    if demo_entry is not None:
        return _demo_room_detail(demo_entry)
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail={"code": "live_duel_not_found"},
    )


@router.post("/{room_id}/join", response_model=dict[str, Any])
async def join_live_duel(
    room_id: str,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> dict[str, Any]:
    """Join a host-created room (increments the seat fill).

    The joiner's real identity is fanned out over the room channel so every
    connected tab (including the host's) adds them to the on-stage grid
    (`JOIN_LIVE_DUEL` → `ADD_PARTICIPANT`).
    """
    repository = LiveDuelRepository(db)
    if repository.find_by_id(room_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    doc = await repository.mark_joined(room_id, current_user.user_id)

    identity_repository = IdentityRepository(db)
    user_doc = await identity_repository.find_user_by_id(current_user.user_id)
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="JOIN_LIVE_DUEL",
        payload={
            "id": current_user.user_id,
            "name": user_doc.username if user_doc else "Player",
            "avatarUrl": user_doc.avatar_url if user_doc else None,
            "isHost": False,
        },
    )
    return LiveDuelRepository.to_entry(doc)


@router.post("/{room_id}/questions", response_model=dict[str, Any])
async def post_live_duel_question(
    room_id: str,
    payload: LiveDuelQuestionRequest,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> dict[str, Any]:
    """Host posts a question live; it is persisted and fanned out via Pub/Sub."""
    repository = LiveDuelRepository(db)
    doc = await repository.find_by_id(room_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    if doc.get("host_user_id") != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "not_host"})

    questions = doc.get("questions", [])
    round_number = len(questions) + 1
    qid = (payload.id or "").strip() or str(ObjectId())
    question = {
        "id": qid,
        "round": round_number,
        "total": max(round_number, 10),
        "text": payload.text.strip(),
        "points": payload.points,
        "timeLabel": payload.time_label,
        "question": payload.question,
    }
    await repository.append_question(room_id, question)
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="POST_LIVE_QUESTION",
        payload=question,
    )
    return question


@router.post("/{room_id}/chat", response_model=dict[str, Any])
async def post_live_duel_chat(
    room_id: str,
    payload: LiveDuelChatRequest,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> dict[str, Any]:
    """Send a chat message to the room; persisted briefly and fanned out live."""
    repository = LiveDuelRepository(db)
    if repository.find_by_id(room_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    message = await _build_chat_message(
        db, current_user.user_id, payload.text.strip(), payload.emoji
    )
    await repository.append_chat(room_id, message)
    pub_payload = {
        "id": message["id"],
        "username": message["username"],
        "avatarUrl": message["avatar_url"],
        "text": message["text"],
        "emoji": message["emoji"],
        "sentAt": message["sent_at"],
    }
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="APPEND_CHAT_MESSAGE",
        payload=pub_payload,
    )
    return pub_payload


# ################################ WEBSOCKET ################################
@router.websocket("/ws")
async def live_duel_ws(
    websocket: WebSocket,
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> None:
    """Realtime room fanout: subscribe to `live_duel:{room_id}` and forward events."""
    room_id = (websocket.query_params.get("room_id") or "").strip()
    if not room_id:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION, reason="Missing room id.")
        return
    session_doc = await _authenticate_ws(websocket, db)
    if session_doc is None:
        return
    user_id = str(session_doc["user_id"])

    settings = get_settings()
    channel = f"{settings.live_duel_pubsub_channel_prefix}{room_id}"
    pubsub = redis.pubsub()
    await websocket.accept()
    try:
        await pubsub.subscribe(channel)
    except Exception as exc:
        logger.warning("live_duel.ws.redis_unavailable", extra={"error": str(exc)})
        await websocket.close(
            code=status.WS_1011_INTERNAL_ERROR,
            reason="Realtime backend unavailable.",
        )
        await pubsub.aclose()
        return

    forward_task = asyncio.create_task(_ws_forward_loop(websocket, pubsub, channel))
    client_task = asyncio.create_task(_ws_client_loop(websocket, redis, db, room_id, user_id))
    try:
        done, pending = await asyncio.wait(
            (forward_task, client_task),
            return_when=asyncio.FIRST_COMPLETED,
        )
        for task in done:
            exc = task.exception()
            if exc is not None and not isinstance(exc, WebSocketDisconnect):
                logger.warning("live_duel.ws.task_failed", extra={"error": str(exc)})
    finally:
        for task in (forward_task, client_task):
            task.cancel()
        await asyncio.gather(forward_task, client_task, return_exceptions=True)
        try:
            await pubsub.unsubscribe(channel)
        finally:
            await pubsub.aclose()


# ################################ /WEBSOCKET ################################