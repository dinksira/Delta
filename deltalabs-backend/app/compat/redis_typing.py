"""Redis annotations: stubs treat ``Redis`` as generic; redis-py 7 runtime class is not."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from redis.asyncio.client import Redis as _Redis

    AsyncRedis = _Redis[str]
else:
    from redis.asyncio import Redis as AsyncRedis

__all__ = ["AsyncRedis"]
# ################################ COMPAT ################################
# ################################ /COMPAT ################################
