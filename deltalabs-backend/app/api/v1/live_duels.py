"""Live Duel HTTP + WebSocket endpoints.

Host-created rooms are persisted in Mongo (the single source of truth for seats,
questions, answers and chat). Created rooms run a realtime Redis Pub/Sub channel
(`live_duel:{room_id}`) that the WebSocket fans out to every client in the room
as reducer-shaped events (`POST_LIVE_QUESTION`, `APPEND_CHAT_MESSAGE`, …) so the
frontend dispatches them directly into its `LiveDuelContext` without changing
the view layer. Finished rooms snapshot their final leaderboard so the lobby's
history/replay surface can list past duels with real results.
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
from app.domain.competitions.repository import Repository as CompetitionRepository
from app.domain.identity.repository import Repository as IdentityRepository
from app.domain.live_duels import queue as live_duels_queue
from app.domain.live_duels.grading import grade_live_duel_answer
from app.domain.live_duels.repository import Repository as LiveDuelRepository
from app.domain.live_duels.schemas import (
    LiveDuelAnswerRequest,
    LiveDuelChatRequest,
    LiveDuelCreateRequest,
    LiveDuelQuestionRequest,
)

router = APIRouter(prefix="/live-duels", tags=["live-duels"])

logger = logging.getLogger("deltalabs.live_duels.api")

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


async def _presence_participant(
    db: AsyncIOMotorDatabase[dict[str, Any]],
    room_doc: dict[str, Any] | None,
    user_id: str,
) -> dict[str, Any]:
    """Resolve one participant for a presence broadcast (sidebar tile shape)."""
    identity_repository = IdentityRepository(db)
    user_doc = await identity_repository.find_user_by_id(user_id)
    host_user_id = room_doc.get("host_user_id") if room_doc else None
    return {
        "id": user_id,
        "name": user_doc.username if user_doc else "Player",
        "avatarUrl": user_doc.avatar_url if user_doc else None,
        "isHost": user_id == host_user_id,
    }


def _live_leaderboard(
    roster: list[dict[str, Any]],
    answers: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Ranked points table (frontend `DuelLeaderboardEntry` shape).

    Every roster member appears once — the host sits at 0 and the real joined
    users carry whatever they earned so far — so the panel's "N players" chip
    and the row highlight stay stable between rounds.
    """
    points_by_user: dict[str, int] = {}
    for answer in answers:
        user_id = str(answer.get("user_id") or "")
        points_by_user[user_id] = points_by_user.get(user_id, 0) + int(
            answer.get("earned_points") or 0
        )
    rows = [
        {
            "userId": participant["id"],
            "name": participant["name"],
            "avatarUrl": participant.get("avatarUrl"),
            "points": points_by_user.get(participant["id"], 0),
        }
        for participant in roster
    ]
    rows.sort(key=lambda row: row["points"], reverse=True)
    for index, row in enumerate(rows):
        row["rank"] = index + 1
    return rows


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
    """Lobby catalog: every host-created room on the platform."""
    repository = LiveDuelRepository(db)
    stored = await repository.list_all()
    return [LiveDuelRepository.to_entry(doc) for doc in stored]


@router.post("", response_model=dict[str, Any], status_code=status.HTTP_201_CREATED)
async def create_live_duel(
    payload: LiveDuelCreateRequest,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> dict[str, Any]:
    """Register a new live duel hosted by the current user.

    A `scheduledAt` start registers the room in `scheduled` status (the launcher
    flips it to live at that time); otherwise it goes live immediately.
    """
    repository = LiveDuelRepository(db)
    oid = ObjectId()
    now = int(time.time())
    doc = {
        "_id": oid,
        "title": payload.title.strip(),
        "subject": payload.subject,
        "difficulty": payload.difficulty,
        "status": "scheduled" if payload.scheduled_at is not None else "live",
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
        "scheduled_at": payload.scheduled_at,
        "last_activity_at": int(time.time() * 1000),
        "questions": [],
        "chat": [],
        "created_at": now,
    }
    await repository.insert(doc)
    return LiveDuelRepository.to_entry(doc)


@router.get("/history", response_model=list[dict[str, Any]])
async def get_live_duel_history(
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
) -> list[dict[str, Any]]:
    """Past duels: finished rooms with their snapshot final leaderboard."""
    repository = LiveDuelRepository(db)
    stored = await repository.list_finished()
    return [LiveDuelRepository.to_entry(doc) for doc in stored]


@router.get("/{room_id}", response_model=dict[str, Any])
async def get_live_duel(
    room_id: str,
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    current_user: CurrentUser | None = Depends(get_current_user_optional),  # noqa: B008
) -> dict[str, Any]:
    """Room detail: entry + posted questions + chat replay.

    `hostIsUser` is derived from the authenticated requester so the frontend can
    re-derive host mode after a page reload (the in-memory session registry does
    not survive a refresh). Finished rooms additionally return their snapshot
    final leaderboard for the replay view.
    """
    repository = LiveDuelRepository(db)
    doc = await repository.find_by_id(room_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    entry = LiveDuelRepository.to_entry(doc)
    is_host = current_user is not None and doc.get("host_user_id") == current_user.user_id
    return {
        **entry,
        "hostIsUser": is_host,
        "participants": await _room_participants(db, doc),
        "leaderboard": _live_leaderboard(
            await _room_participants(db, doc),
            doc.get("answers", []),
        ),
        "answers": [
            {
                "questionId": answer.get("question_id"),
                "userId": str(answer.get("user_id") or ""),
                "answer": answer.get("answer", {}),
                "correct": answer.get("correct"),
                "earnedPoints": answer.get("earned_points", 0),
            }
            for answer in doc.get("answers", [])
        ],
        "chat": [LiveDuelRepository.to_chat(msg) for msg in reversed(doc.get("chat", []))],
        "finalLeaderboard": doc.get("final_leaderboard") or None,
        "finishedAt": doc.get("finished_at") or None,
    }


@router.post("/{room_id}/finish", response_model=dict[str, Any])
async def finish_live_duel(
    room_id: str,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> dict[str, Any]:
    """Host ends a live duel: freezes the seats, snapshots the final leaderboard.

    The final leaderboard and completion time are persisted on the room document
    so the lobby history/replay surface can surface real results after the
    WebSocket channel is gone. The ending is also fanned out (`DUEL_ENDED`) so
    every participant tab closes the workspace instead of hanging on a frozen
    "live" stage.
    """
    repository = LiveDuelRepository(db)
    doc = await repository.find_by_id(room_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    if doc.get("host_user_id") != current_user.user_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "not_host"})
    if doc.get("status") == "finished":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "already_finished"},
        )

    roster = await _room_participants(db, doc)
    final_leaderboard = _live_leaderboard(roster, doc.get("answers", []))
    winner_name = None
    winner_user_id = None
    for row in final_leaderboard:
        if int(row.get("points") or 0) > 0:
            winner_name = str(row.get("name") or "Champion")
            winner_user_id = str(row.get("userId") or "")
            break
    updated_doc, transitioned = await repository.mark_finished(
        room_id,
        final_leaderboard=final_leaderboard,
        winner_name=winner_name,
    )
    if updated_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    if not transitioned:
        # Lost a race against another finisher: their snapshot and their
        # side effects are authoritative, so publish and credit nothing.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={"code": "already_finished"},
        )
    if winner_user_id:
        # The freeze is what makes the win real, so the stat is credited only
        # on the transition. `won` feeds the hub's Champion achievement, which
        # pays its reward out of the competition wallet on the next read.
        await CompetitionRepository(db).increment_user_stats(
            winner_user_id,
            increments={"won": 1},
        )
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="DUEL_ENDED",
        payload={
            "reason": "host_finished",
            "finalLeaderboard": final_leaderboard,
            "winnerName": winner_name,
            "finishedAt": updated_doc.get("finished_at") or None,
        },
    )
    return {
        **LiveDuelRepository.to_entry(updated_doc),
        "finalLeaderboard": final_leaderboard,
        "winnerName": winner_name,
        "finishedAt": updated_doc.get("finished_at") or None,
    }


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
    if await repository.find_by_id(room_id) is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    doc = await repository.mark_joined(room_id, current_user.user_id)
    if doc is None:
        # Room was swept or deleted between the existence check and the seat write.
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )

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
    roster = await _room_participants(db, doc)
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="UPDATE_LEADERBOARD",
        payload=_live_leaderboard(roster, doc.get("answers", [])),
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


@router.post("/{room_id}/questions/{question_id}/answers", response_model=dict[str, Any])
async def submit_live_duel_answer(
    room_id: str,
    question_id: str,
    payload: LiveDuelAnswerRequest,
    current_user: CurrentUser = Depends(get_current_user),  # noqa: B008
    db: AsyncIOMotorDatabase[dict[str, Any]] = Depends(get_db),  # noqa: B008
    redis: AsyncRedis = Depends(get_redis),  # noqa: B008
) -> dict[str, Any]:
    """Participant submits an answer to the live question.

    The authored payload is graded on the server exactly like the duel quiz
    (`grade_live_duel_answer`); the resulting points are folded into the room
    leaderboard, which is recomputed and fanned out so every tab sees the ranked
    table move in real time. Re-submitting the same question is idempotent and
    returns the original result so a retry never double-counts points.
    """
    repository = LiveDuelRepository(db)
    doc = await repository.find_by_id(room_id)
    if doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    if current_user.user_id not in [str(user_id) for user_id in doc.get("joined_user_ids", [])]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail={"code": "not_joined"})
    if doc.get("host_user_id") == current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "host_cannot_answer"},
        )

    question = next(
        (entry for entry in doc.get("questions", []) if entry.get("id") == question_id),
        None,
    )
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_question_not_found"},
        )

    existing = next(
        (
            entry
            for entry in doc.get("answers", [])
            if entry.get("question_id") == question_id
            and str(entry.get("user_id")) == current_user.user_id
        ),
        None,
    )
    if existing is not None:
        roster = await _room_participants(db, doc)
        leaderboard = _live_leaderboard(roster, doc.get("answers", []))
        return {
            "questionId": question_id,
            "correct": existing.get("correct"),
            "earnedPoints": existing.get("earned_points", 0),
            "leaderboard": leaderboard,
        }

    authored = question.get("question")
    if isinstance(authored, dict):
        correct = grade_live_duel_answer(authored, payload.answer)
        earned_points = int(question.get("points") or 0) if correct is True else 0
    else:
        correct = None
        earned_points = 0
    record = {
        "question_id": question_id,
        "user_id": current_user.user_id,
        "answer": payload.answer,
        "correct": correct,
        "earned_points": earned_points,
        "at": int(time.time() * 1000),
    }
    updated_doc = await repository.append_answer(room_id, record)
    if updated_doc is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "live_duel_not_found"},
        )
    roster = await _room_participants(db, updated_doc)
    leaderboard = _live_leaderboard(roster, updated_doc.get("answers", []))
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="UPDATE_LEADERBOARD",
        payload=leaderboard,
    )
    return {
        "questionId": question_id,
        "correct": correct,
        "earnedPoints": earned_points,
        "leaderboard": leaderboard,
    }


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
    if await repository.find_by_id(room_id) is None:
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
    """Realtime room fanout: subscribe to `live_duel:{room_id}` and forward events.

    Connect/close also maintain the room's online-presence set and broadcast
    `PARTICIPANT_ONLINE` / `PARTICIPANT_OFFLINE` so every tab's roster shows who
    is actually holding an open socket (a transient reconnect does not touch the
    Mongo roster — only this short-lived Redis marker).
    """
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

    # Announce this socket so the roster reflects real connectivity; the offline
    # marker is cleared in the finally block when this connection closes.
    room_doc = await LiveDuelRepository(db).find_by_id(room_id)
    presence = await _presence_participant(db, room_doc, user_id)
    await live_duels_queue.add_online_participant(redis, room_id=room_id, user_id=user_id)
    await live_duels_queue.publish_live_duel_update(
        redis,
        room_id=room_id,
        type="PARTICIPANT_ONLINE",
        payload=presence,
    )

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
        await live_duels_queue.remove_online_participant(
            redis, room_id=room_id, user_id=user_id
        )
        await live_duels_queue.publish_live_duel_update(
            redis,
            room_id=room_id,
            type="PARTICIPANT_OFFLINE",
            payload={"id": user_id},
        )


# ################################ /WEBSOCKET ################################