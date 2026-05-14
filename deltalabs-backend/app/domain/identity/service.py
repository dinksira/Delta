"""Identity business logic for auth/session."""

from __future__ import annotations

from app.core.config import get_settings
from app.core.exceptions import ConflictError, ValidationError
from app.core.security import (
    PasswordPolicyError,
    hash_password,
    hash_session_token,
    issue_session_token,
    validate_password_policy,
    verify_password,
)
from app.domain.identity.repository import Repository
from app.domain.identity.schemas import (
    AuthIssuedResponse,
    AuthSuccessResponse,
    AuthUserPublic,
    LoginRequest,
    SessionPublic,
    SignupInitRequest,
    UserPasswordChange,
)


# ################################ SERVICE ################################
# Identity authentication lifecycle (signup/login/session/logout).
class Service:
    """Identity service with signup/login/session/logout flows."""

    def __init__(self, repository: Repository) -> None:
        self._repository = repository

    async def healthcheck(self) -> bool:
        """Basic healthcheck used by legacy tests."""
        return await self._repository.ping()

    async def bootstrap_indexes(self) -> None:
        """Ensure required auth/session indexes exist."""
        await self._repository.ensure_indexes()

    async def signup_init(self, payload: SignupInitRequest) -> AuthIssuedResponse:
        """Create account and immediately open a session."""
        try:
            validate_password_policy(payload.password)
        except PasswordPolicyError as exc:
            raise ValidationError(str(exc), code="password_policy_failed") from exc

        existing_username = await self._repository.find_user_by_identity(payload.username)
        if existing_username is not None:
            raise ConflictError("Identity already exists.", code="identity_already_exists")

        if payload.email is not None:
            existing_email = await self._repository.find_user_by_identity(payload.email)
            if existing_email is not None:
                raise ConflictError("Identity already exists.", code="identity_already_exists")

        if payload.phone_e164 is not None:
            existing_phone = await self._repository.find_user_by_identity(payload.phone_e164)
            if existing_phone is not None:
                raise ConflictError("Identity already exists.", code="identity_already_exists")

        user = await self._repository.create_user_with_password(
            username=payload.username,
            email=payload.email,
            phone_e164=payload.phone_e164,
            password_hash=hash_password(payload.password),
        )
        return await self._issue_auth_response(user_id=user.id)

    async def login(self, payload: LoginRequest) -> AuthIssuedResponse:
        """Validate user credentials and issue a new session."""
        user = await self._repository.find_user_by_identity(payload.identity)
        if user is None:
            raise ValidationError("Invalid credentials.", code="invalid_credentials")
        if not user.is_active:
            raise ValidationError("Account is inactive.", code="account_inactive")
        if not verify_password(payload.password, user.password_hash):
            raise ValidationError("Invalid credentials.", code="invalid_credentials")
        return await self._issue_auth_response(user_id=user.id)

    async def session_from_token(self, bearer_token: str) -> AuthSuccessResponse:
        """Resolve active session payload from bearer token."""
        token_hash = hash_session_token(bearer_token)
        session_doc = await self._repository.find_session_by_token_hash(token_hash)
        if session_doc is None:
            raise ValidationError("Session is invalid or expired.", code="invalid_session")
        user = await self._repository.find_user_by_id(str(session_doc["user_id"]))
        if user is None:
            raise ValidationError("Session is invalid or expired.", code="invalid_session")
        session = SessionPublic(
            session_id=str(session_doc["_id"]),
            user_id=user.id,
            expires_at=session_doc["expires_at"],
        )
        return AuthSuccessResponse(
            session=session,
            user=AuthUserPublic(
                user_id=user.id,
                username=user.username,
                full_name=user.full_name,
                email=user.email,
                phone_e164=user.phone_e164,
                bio=user.bio,
                avatar_url=user.avatar_url,
                followers_count=user.followers_count,
                following_count=user.following_count,
                is_verified=user.is_verified,
            ),
        )

    async def logout(self, bearer_token: str) -> None:
        """Revoke session if present."""
        token_hash = hash_session_token(bearer_token)
        await self._repository.revoke_session(token_hash)

    async def get_profile(self, user_id: str) -> AuthUserPublic:
        """Fetch public profile for a user."""
        user = await self._repository.find_user_by_id(user_id)
        if user is None:
            raise ValidationError("User not found.", code="user_not_found")
        return AuthUserPublic(
            user_id=user.id,
            username=user.username,
            full_name=user.full_name,
            email=user.email,
            phone_e164=user.phone_e164,
            bio=user.bio,
            avatar_url=user.avatar_url,
            followers_count=user.followers_count,
            following_count=user.following_count,
            is_verified=user.is_verified,
        )

    async def update_profile(
        self, user_id: str, payload: UserProfileUpdate
    ) -> AuthUserPublic:
        """Update user profile text fields."""
        await self._repository.update_user_profile(
            user_id=user_id,
            full_name=payload.full_name,
            bio=payload.bio,
        )
        return await self.get_profile(user_id)

    async def update_avatar(self, user_id: str, avatar_url: str) -> AuthUserPublic:
        """Update user avatar URL."""
        await self._repository.update_user_profile(
            user_id=user_id,
            avatar_url=avatar_url,
        )
        return await self.get_profile(user_id)

    async def delete_account(self, user_id: str) -> bool:
        """Permanently remove user account and all session data."""
        return await self._repository.delete_user(user_id)

    async def change_password(self, user_id: str, payload: UserPasswordChange) -> bool:
        """Verify current password and set new password hash."""
        user = await self._repository.find_user_by_id(user_id)
        if user is None:
            raise ValidationError("User not found.", code="user_not_found")
        if not verify_password(payload.current_password, user.password_hash):
            raise ValidationError("Invalid current password.", code="invalid_password")
        
        try:
            validate_password_policy(payload.new_password)
        except PasswordPolicyError as exc:
            raise ValidationError(str(exc), code="password_policy_failed") from exc
        
        await self._repository.update_password_hash(
            user_id=user_id,
            password_hash=hash_password(payload.new_password),
        )
        return True

    async def _issue_auth_response(self, *, user_id: str) -> AuthIssuedResponse:
        user = await self._repository.find_user_by_id(user_id)
        if user is None:
            raise ValidationError(
                "Unable to resolve user after operation.",
                code="identity_unavailable",
            )
        raw_token = issue_session_token()
        token_hash = hash_session_token(raw_token)
        settings = get_settings()
        session_doc = await self._repository.create_session(
            user_id=user.id,
            token_hash=token_hash,
            ttl_minutes=settings.access_token_expire_minutes,
            max_sessions=settings.max_sessions_per_user,
        )
        session = SessionPublic(
            session_id=str(session_doc["_id"]),
            user_id=user.id,
            expires_at=session_doc["expires_at"],
        )
        return AuthIssuedResponse(
            access_token=raw_token,
            session=session,
            user=AuthUserPublic(
                user_id=user.id,
                username=user.username,
                full_name=user.full_name,
                email=user.email,
                phone_e164=user.phone_e164,
                bio=user.bio,
                avatar_url=user.avatar_url,
                followers_count=user.followers_count,
                following_count=user.following_count,
                is_verified=user.is_verified,
            ),
        )


# ################################ /SERVICE ################################
