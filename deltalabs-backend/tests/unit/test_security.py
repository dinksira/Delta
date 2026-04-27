"""Unit tests for security helpers."""

from app.core.security import hash_password, hash_session_token, verify_password


def test_hash_and_verify_password_roundtrip() -> None:
    password_hash = hash_password("StrongPass123")
    assert verify_password("StrongPass123", password_hash) is True
    assert verify_password("WrongPass123", password_hash) is False


def test_hash_session_token_is_stable() -> None:
    token = "sample-token"
    assert hash_session_token(token) == hash_session_token(token)


# ################################ MODULE ################################
# ################################ /MODULE ################################
