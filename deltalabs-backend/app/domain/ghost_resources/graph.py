"""Directed chain graph helpers for Ghost Resources."""

from __future__ import annotations

from collections import defaultdict, deque
from typing import Iterable


MAX_NODES = 50
MAX_EDGES = 100


def would_create_cycle(
    *,
    edges: Iterable[tuple[str, str]],
    new_from: str,
    new_to: str,
) -> bool:
    """Return True if adding new_from → new_to creates a cycle."""
    if new_from == new_to:
        return True
    adj: dict[str, list[str]] = defaultdict(list)
    for frm, to in edges:
        adj[frm].append(to)
    adj[new_from].append(new_to)

    seen: set[str] = set()
    q: deque[str] = deque([new_to])
    while q:
        cur = q.popleft()
        if cur == new_from:
            return True
        if cur in seen:
            continue
        seen.add(cur)
        q.extend(adj.get(cur, []))
    return False
