"""Competition wallet: an append-only double-entry ledger for prize money.

The ledger is deliberately gateway-agnostic. It records *obligations* — money
Delta Labs owes a participant — rather than moving real funds. When a payment
gateway is chosen it becomes one more account (``external:cash``) funded from
entry-fee escrow; the entry shape does not have to change.

Every entry carries balanced legs whose deltas sum to zero, so the total across
all accounts is conserved by construction and "where did this money come from"
is answerable by replaying the log. ``competition_wallets`` is only a
materialised projection of that log and can always be rebuilt from it.

This replaces an opaque ``earnings_etb`` counter that was incremented straight
from stage completion, which could show a participant a balance that no entry
explained and that no payout could ever be reconciled against.

@example
    await WalletRepository(db).credit_stage_prize(
        user_id="user-1",
        amount_etb=60,
        idempotency_key="game_stage:game-1:3",
        source={"type": "game_stage", "id": "game-1", "order": 3},
    )
"""

from __future__ import annotations

import logging
from datetime import UTC, datetime
from typing import Any, Literal
from uuid import uuid4

from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING
from pymongo.asynchronous.client_session import AsyncClientSession
from pymongo.errors import DuplicateKeyError, OperationFailure

logger = logging.getLogger("deltalabs.competitions.wallet")

# ===== CONSTANTS =====

LedgerEntryKind = Literal[
    "prize_credit",
    "prize_reversal",
    "escrow_funding",
    "payout",
]

CURRENCY = "ETB"

# Non-participant accounts. Anything without a known prefix is a participant.
PRIZE_POOL_ACCOUNT = "prize_pool"
ESCROW_ACCOUNT = "escrow:entry_fees"
EXTERNAL_CASH_ACCOUNT = "external:cash"

# MongoDB reports this when a transaction is requested but the deployment is a
# standalone server. Matches the fallback already used for seat + stats writes.
_STANDALONE_TRANSACTION_CODE = 20


def participant_account_id(user_id: str) -> str:
    return f"participant:{user_id}"


def _account_owner(account_id: str) -> str:
    """``participant:u1`` -> ``participant``; ``prize_pool`` -> ``prize_pool``."""
    owner, _, _ = account_id.partition(":")
    return owner


# ===== REPOSITORY =====


class WalletRepository:
    """Append-only ledger plus a rebuildable balance projection."""

    def __init__(self, db: AsyncIOMotorDatabase[dict[str, Any]]) -> None:
        self._db = db

    async def ensure_indexes(self) -> None:
        # A repeated business key must never mint a second entry, so the
        # idempotency key is unique rather than merely indexed. This is the
        # double-spend guarantee, not the balance update.
        await self._db["competition_wallet_ledger"].create_index(
            [("idempotency_key", ASCENDING)],
            unique=True,
            name="ux_competition_wallet_ledger_idempotency",
        )
        await self._db["competition_wallet_ledger"].create_index(
            [("created_at", DESCENDING)],
            name="ix_competition_wallet_ledger_created",
        )
        # `legs.account` is multikey; `created_at` is scalar, so the pair is legal.
        await self._db["competition_wallet_ledger"].create_index(
            [("legs.account", ASCENDING), ("created_at", ASCENDING)],
            name="ix_competition_wallet_ledger_account",
        )
        await self._db["competition_wallet_ledger"].create_index(
            [("source.type", ASCENDING), ("source.id", ASCENDING)],
            name="ix_competition_wallet_ledger_source",
        )
        await self._db["competition_wallets"].create_index(
            [("owner", ASCENDING)],
            name="ix_competition_wallets_owner",
        )

    # --------------------------------------------------------------------
    # Writing
    # --------------------------------------------------------------------

    async def post_entry(
        self,
        *,
        idempotency_key: str,
        kind: LedgerEntryKind,
        legs: list[tuple[str, int]],
        source: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any] | None, bool]:
        """Append one balanced entry and move the balance projection with it.

        Returns ``(entry, created)``. ``created`` is ``False`` when this call
        replayed an idempotency key that was already posted, in which case no
        balance moves and the stored entry is returned unchanged.

        Raises ``ValueError`` for an unbalanced or empty leg set. That is a
        caller bug rather than user input, so it is not an HTTP-shaped error.
        """
        if not legs:
            raise ValueError("ledger entry needs at least one leg")
        total = sum(delta for _, delta in legs)
        if total != 0:
            raise ValueError(f"ledger legs must sum to zero, got {total}")

        entry = {
            "_id": f"lgr_{uuid4().hex}",
            "idempotency_key": idempotency_key,
            "kind": kind,
            "currency": CURRENCY,
            "legs": [{"account": account, "delta_etb": delta} for account, delta in legs],
            "source": source,
            "metadata": metadata or {},
            "created_at": datetime.now(UTC),
        }
        return await self._post(entry)

    async def _post(self, entry: dict[str, Any]) -> tuple[dict[str, Any] | None, bool]:
        """Insert the entry and apply its legs, transactionally where possible.

        On a standalone deployment the two writes fall back to sequential. That
        costs cross-document atomicity, but it cannot double-credit: a replay
        loses the unique index race and moves no balance, so retrying converges.
        """
        client = self._db.client
        try:
            async with await client.start_session() as session, session.start_transaction():
                created = await self._insert(entry, session=session)
                if created:
                    await self._apply_legs(entry["legs"], session=session)
        except OperationFailure as exc:
            if exc.code != _STANDALONE_TRANSACTION_CODE:
                raise
            logger.info("wallet.transaction_unavailable_using_sequential_writes")
            created = await self._insert(entry, session=None)
            if created:
                await self._apply_legs(entry["legs"], session=None)
        return await self.find_by_idempotency_key(entry["idempotency_key"]), created

    async def _insert(self, entry: dict[str, Any], *, session: AsyncClientSession | None) -> bool:
        """Insert the entry. False means the key was already taken."""
        try:
            await self._db["competition_wallet_ledger"].insert_one(entry, session=session)
        except DuplicateKeyError:
            # Another writer posted this idempotency key first. Theirs is
            # authoritative; ours is discarded without touching any balance.
            return False
        return True

    async def _apply_legs(
        self,
        legs: list[dict[str, Any]],
        *,
        session: AsyncClientSession | None,
    ) -> None:
        now = datetime.now(UTC)
        for leg in legs:
            account = str(leg["account"])
            # A path may not be touched by more than one update operator, so each
            # field is owned by exactly one: `balance_etb` moves via `$inc`,
            # `owner`/`updated_at` are written by `$set` on every write, and only
            # `created_at` is seeded on insert. `_id` comes from the equality
            # filter Mongo copies into an upserted document.
            await self._db["competition_wallets"].update_one(
                {"_id": account},
                {
                    "$inc": {"balance_etb": int(leg["delta_etb"])},
                    "$set": {"owner": _account_owner(account), "updated_at": now},
                    "$setOnInsert": {"created_at": now},
                },
                upsert=True,
                session=session,
            )

    async def credit_stage_prize(
        self,
        *,
        user_id: str,
        amount_etb: int,
        idempotency_key: str,
        source: dict[str, Any],
        metadata: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any] | None, bool]:
        """Owe a participant a stage prize, drawn from the prize pool.

        The pool leg is what keeps the obligation visible: it moves negative by
        the same amount, which is precisely the gap that entry-fee escrow will
        fund once a gateway exists. Recording the shortfall rather than hiding
        it is the reason this is a ledger and not a counter.

        A non-positive amount posts nothing — there is no money to move, so
        there is nothing to deduplicate either.
        """
        if amount_etb <= 0:
            return await self.find_by_idempotency_key(idempotency_key), False
        return await self.post_entry(
            idempotency_key=idempotency_key,
            kind="prize_credit",
            legs=[
                (participant_account_id(user_id), amount_etb),
                (PRIZE_POOL_ACCOUNT, -amount_etb),
            ],
            source=source,
            metadata=metadata,
        )

    async def credit_achievement_reward(
        self,
        *,
        user_id: str,
        rule_id: str,
        amount_etb: int,
        metadata: dict[str, Any] | None = None,
    ) -> tuple[dict[str, Any] | None, bool]:
        """Owe a participant their achievement reward, drawn from the prize pool.

        Same double-entry shape as a stage prize: the pool leg records the
        obligation. The idempotency key is derived from the business fact
        (this user unlocked this rule), so a hub re-read — or two concurrent
        ones — can never pay the reward twice.
        """
        return await self.credit_stage_prize(
            user_id=user_id,
            amount_etb=amount_etb,
            idempotency_key=f"achievement:{user_id}:{rule_id}",
            source={"type": "achievement", "id": rule_id},
            metadata=metadata,
        )

    # --------------------------------------------------------------------
    # Reading
    # --------------------------------------------------------------------

    async def find_by_idempotency_key(self, idempotency_key: str) -> dict[str, Any] | None:
        return await self._db["competition_wallet_ledger"].find_one(
            {"idempotency_key": idempotency_key}
        )

    async def get_balance_etb(self, account_id: str) -> int:
        doc = await self._db["competition_wallets"].find_one({"_id": account_id})
        return int(doc.get("balance_etb", 0)) if doc else 0

    async def get_participant_balance_etb(self, user_id: str) -> int:
        return await self.get_balance_etb(participant_account_id(user_id))

    async def list_entries(
        self,
        *,
        account_id: str | None = None,
        limit: int = 50,
    ) -> list[dict[str, Any]]:
        """Newest-first ledger history, optionally for a single account."""
        query: dict[str, Any] = {"legs.account": account_id} if account_id else {}
        cursor = self._db["competition_wallet_ledger"].find(query).sort(
            "created_at", DESCENDING
        )
        return await cursor.to_list(length=limit)

    # --------------------------------------------------------------------
    # Reconciliation
    # --------------------------------------------------------------------

    async def verify_conservation(self) -> int:
        """Sum every leg in the ledger. Zero means no money was invented."""
        pipeline = [
            {"$unwind": "$legs"},
            {"$group": {"_id": None, "total": {"$sum": "$legs.delta_etb"}}},
        ]
        rows = await self._db["competition_wallet_ledger"].aggregate(pipeline).to_list(length=1)
        return int(rows[0]["total"]) if rows else 0

    async def rebuild_balances(self) -> dict[str, int]:
        """Recompute balances from the ledger and return the corrections applied.

        The projection is a cache, not a source of truth, so it can be discarded
        and rebuilt at any time. Returns ``{account: correction}`` and only
        includes accounts that were actually wrong, so an empty result means the
        projection and the log already agree.
        """
        pipeline = [
            {"$unwind": "$legs"},
            {"$group": {"_id": "$legs.account", "balance_etb": {"$sum": "$legs.delta_etb"}}},
        ]
        rows = await self._db["competition_wallet_ledger"].aggregate(pipeline).to_list(length=None)
        derived = {str(row["_id"]): int(row["balance_etb"]) for row in rows}
        corrections: dict[str, int] = {}
        for account, expected in derived.items():
            current = await self.get_balance_etb(account)
            if current == expected:
                continue
            corrections[account] = expected - current
            await self._db["competition_wallets"].update_one(
                {"_id": account},
                {"$set": {"balance_etb": expected, "owner": _account_owner(account)}},
                upsert=True,
            )
        if corrections:
            logger.warning(
                "wallet.balance_projection_drift_corrected",
                extra={"accounts": len(corrections)},
            )
        return corrections