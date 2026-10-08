"""Server-side grading for topic-battle questions.

The grading rules themselves are not defined here. `grade_live_duel_answer` in
`app.domain.live_duels.grading` owns them, and this module only translates
between two shapes:

- topic-battle questions are persisted in MongoDB with snake_case keys
  (`mcq_correct_id`, `tf_answer`, `fill_answers`, ...);
- the shared grader expects the camelCase keys the duel-quiz client runtime
  produces (`mcqCorrectId`, `tfAnswer`, `fillAnswers`, ...).

Keeping the rules in one place means a fix to, say, fill-blank normalization
applies to both live duels and topic battles. Keeping the translation here means
the shared grader never has to learn about a database storage convention that
has nothing to do with it.
"""

from __future__ import annotations

from typing import Any

from app.domain.live_duels.grading import grade_live_duel_answer

# Storage key -> grader key for the plain scalar fields. Anything not listed here
# is either nested (handled below) or deliberately absent.
_SCALAR_KEY_MAP: dict[str, str] = {
    "mcq_correct_id": "mcqCorrectId",
    "tf_answer": "tfAnswer",
    "fill_expected": "fillExpected",
    "fill_answers": "fillAnswers",
}


def stored_question_to_grader_shape(question: dict[str, Any]) -> dict[str, Any]:
    """Project a persisted question document into the shared grader's contract.

    Only the keys the grader actually reads are carried over. This is the one
    place permitted to look at answer keys for the purpose of grading, so it is
    deliberately narrow: no test cases, no hint text, no participant-facing
    content that the grader does not consult.
    """
    grader_shape: dict[str, Any] = {
        "kind": question.get("kind", "multiple_choice"),
        "id": question.get("id"),
    }

    for stored_key, grader_key in _SCALAR_KEY_MAP.items():
        if stored_key in question:
            grader_shape[grader_key] = question[stored_key]

    # `matching_pairs` persists `answer_id`; the grader reads `answerId`.
    grader_shape["matchingPairs"] = [
        {
            "id": pair.get("id"),
            "answerId": pair.get("answer_id", pair.get("answerId")),
        }
        for pair in question.get("matching_pairs", [])
        if isinstance(pair, dict)
    ]

    # The grader compares authored item ids against the submitted order.
    grader_shape["orderingItems"] = [
        {"id": item.get("id")}
        for item in question.get("ordering_items", [])
        if isinstance(item, dict)
    ]

    return grader_shape


def grade_stored_question(question: dict[str, Any], answer: dict[str, Any]) -> bool | None:
    """Grade a persisted topic-battle question.

    Returns `True`/`False` when the answer was auto-graded, and `None` when the
    kind is subjective (writing, coding, markdown, design) or the question has no
    authored key. `None` means "park this for a human", never "wrong" — collapsing
    the two would silently zero out every essay submission.
    """
    return grade_live_duel_answer(stored_question_to_grader_shape(question), answer)