"""Unit tests for domain exception types."""

from typing import Any

import pytest
from app.core.exceptions import (
    ConflictError,
    DeltaLabsBaseError,
    NotFoundError,
    ValidationError,
)


def test_base_error_defaults() -> None:
    err = DeltaLabsBaseError("oops")
    assert err.message == "oops"
    assert err.code == "delta_labs_error"
    assert err.details is None
    assert str(err) == "oops"


def test_base_error_explicit_code_and_details() -> None:
    details: dict[str, Any] = {"field": "email"}
    err = DeltaLabsBaseError("bad", code="custom", details=details)
    assert err.code == "custom"
    assert err.details == details


@pytest.mark.parametrize(
    ("cls", "expected_code"),
    [
        (NotFoundError, "not_found"),
        (ConflictError, "conflict"),
        (ValidationError, "validation_error"),
    ],
)
def test_subclass_default_codes(
    cls: type[DeltaLabsBaseError],
    expected_code: str,
) -> None:
    err = cls("msg")
    assert err.code == expected_code
    assert err.message == "msg"


def test_subclass_override_code() -> None:
    err = NotFoundError("missing", code="course_not_found")
    assert err.code == "course_not_found"


# ################################ MODULE ################################
# ################################ /MODULE ################################
