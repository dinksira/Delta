"""Server-side grading for Live Duel answers.

Mirrors `gradeQuestion` / `normalizeText` in
`deltalabs-frontend/src/modules/Competition/types/duelQuiz.ts` so a participant's
objective answer (MCQ, True/False, fill-blank, matching, ordering) is scored on
the authoritative authored payload. Subjective kinds (writing / coding /
markdown / design) are recorded for review, never auto-scored.
"""

from __future__ import annotations

import re
from typing import Any

_NOT_GRADED = None


def _normalize(value: str) -> str:
    """Forgiving text normalization (`normalizeText` in the duel quiz types)."""
    return re.sub(r"\s+", " ", value.strip().lower())


def grade_live_duel_answer(question: dict[str, Any], answer: dict[str, Any]) -> bool | None:
    """Grade an objective-kind answer.

    Matches the client duel-quiz semantics:

    - `multiple_choice` grants when the chosen `optionId` equals `mcqCorrectId`
      and a correct answer was authored (empty correct id never scores).
    - `true_false` compares the boolean `value` to `tfAnswer`.
    - `fill_blank` compares every blank (multi-blank `fillAnswers`) in order, or
      falls back to the legacy whole-sentence `fillExpected`; a question with no
      authored answer key is not auto-graded.
    - `matching` requires every pair to map to its authored `answerId`.
    - `ordering` requires the exact authored item order.
    - writing / coding / markdown / design return `None` (recorded for review).

    Returns `True`/`False` when graded, `None` when not auto-graded.
    """
    kind = question.get("kind", "multiple_choice")

    if kind == "multiple_choice":
        correct_id = question.get("mcqCorrectId") or ""
        if not correct_id:
            return _NOT_GRADED
        return answer.get("optionId") == correct_id

    if kind == "true_false":
        return bool(answer.get("value")) == bool(question.get("tfAnswer"))

    if kind == "fill_blank":
        answers = question.get("fillAnswers") or []
        if answers:
            submitted = answer.get("answers")
            if not isinstance(submitted, list) or len(submitted) != len(answers):
                return _NOT_GRADED
            return all(
                _normalize(str(value or "")) == _normalize(str(expected or ""))
                for value, expected in zip(submitted, answers)
            )
        expected = _normalize(str(question.get("fillExpected") or ""))
        if not expected:
            return _NOT_GRADED
        return _normalize(str(answer.get("text") or "")) == expected

    if kind == "matching":
        mapping = answer.get("map")
        if not isinstance(mapping, dict):
            return _NOT_GRADED
        pairs = question.get("matchingPairs") or []
        return all(mapping.get(pair.get("id")) == pair.get("answerId") for pair in pairs)

    if kind == "ordering":
        authored = [item.get("id") for item in question.get("orderingItems") or []]
        proposed = answer.get("itemIds")
        if not isinstance(proposed, list):
            return _NOT_GRADED
        return authored == proposed

    return _NOT_GRADED