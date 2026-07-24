"""Shared metadata helpers for ghost host adapters."""

from __future__ import annotations

from copy import deepcopy
from typing import Any


def deep_set(root: dict[str, Any], dotted_path: str, value: Any) -> dict[str, Any]:
    """Set a nested value using a dotted path (e.g. about.coverImageUrl)."""
    parts = [p for p in dotted_path.split(".") if p]
    if not parts:
        return root
    cur: dict[str, Any] = root
    for part in parts[:-1]:
        nxt = cur.get(part)
        if not isinstance(nxt, dict):
            nxt = {}
            cur[part] = nxt
        cur = nxt
    cur[parts[-1]] = value
    return root


def clone_metadata(raw: Any) -> dict[str, Any]:
    if isinstance(raw, dict):
        return deepcopy(raw)
    return {}
