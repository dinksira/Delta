"""Security helpers for identity/session workflows."""

from __future__ import annotations

import base64
import hashlib
import hmac
import secrets
from dataclasses import dataclass


class PasswordPolicyError(ValueError):
    """Raised when a password does not meet baseline policy."""


# ################################ SECURITY ################################
@dataclass(frozen=True, slots=True)
class PasswordHash:
    """Structured password hash payload suitable for persistence."""

    algorithm: str
    salt_b64: str
    digest_b64: str

    def encode(self) -> str:
        return f"{self.algorithm}${self.salt_b64}${self.digest_b64}"

    @classmethod
    def decode(cls, value: str) -> PasswordHash:
        algorithm, salt_b64, digest_b64 = value.split("$", maxsplit=2)
        return cls(algorithm=algorithm, salt_b64=salt_b64, digest_b64=digest_b64)


PASSWORD_ALGORITHM = "scrypt-v1"
_SCRYPT_N = 2**14
_SCRYPT_R = 8
_SCRYPT_P = 1
_SCRYPT_DKLEN = 64


def validate_password_policy(password: str) -> None:
    """Enforce the baseline password policy for identity endpoints."""
    if len(password) < 10:
        raise PasswordPolicyError("Password must be at least 10 characters long.")
    if password.lower() == password:
        raise PasswordPolicyError("Password must contain at least one uppercase letter.")
    if password.upper() == password:
        raise PasswordPolicyError("Password must contain at least one lowercase letter.")
    if not any(ch.isdigit() for ch in password):
        raise PasswordPolicyError("Password must contain at least one digit.")


def hash_password(password: str) -> str:
    """Hash a password with per-password random salt."""
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=_SCRYPT_DKLEN,
    )
    payload = PasswordHash(
        algorithm=PASSWORD_ALGORITHM,
        salt_b64=base64.b64encode(salt).decode("ascii"),
        digest_b64=base64.b64encode(digest).decode("ascii"),
    )
    return payload.encode()


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a clear-text password against stored hash payload."""
    payload = PasswordHash.decode(password_hash)
    if payload.algorithm != PASSWORD_ALGORITHM:
        return False
    salt = base64.b64decode(payload.salt_b64.encode("ascii"))
    expected = base64.b64decode(payload.digest_b64.encode("ascii"))
    actual = hashlib.scrypt(
        password.encode("utf-8"),
        salt=salt,
        n=_SCRYPT_N,
        r=_SCRYPT_R,
        p=_SCRYPT_P,
        dklen=len(expected),
    )
    return hmac.compare_digest(actual, expected)


def issue_session_token() -> str:
    """Issue opaque session token for bearer auth."""
    return secrets.token_urlsafe(48)


def hash_session_token(token: str) -> str:
    """One-way hash for token-at-rest security."""
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


# ################################ /SECURITY ################################
