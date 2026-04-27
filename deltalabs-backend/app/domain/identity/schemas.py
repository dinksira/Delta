"""Identity domain schemas used by auth/session APIs."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class DomainEntity(BaseModel):
    """Backward-compatible skeleton symbol for foundation tests."""

    # ################################ TYPES ################################
    id: str


class UserRecord(BaseModel):
    """Canonical user projection stored in MongoDB."""

    id: str
    username: str
    username_normalized: str
    email: str | None = None
    email_normalized: str | None = None
    phone_e164: str | None = None
    is_active: bool = True
    is_verified: bool = False
    created_at: datetime
    updated_at: datetime
    password_hash: str


class SignupInitRequest(BaseModel):
    """Initial signup payload for P1."""

    username: str = Field(min_length=3, max_length=40)
    email: str | None = None
    phone_e164: str | None = None
    password: str = Field(min_length=10, max_length=256)


class LoginRequest(BaseModel):
    """Login payload (identity + password)."""

    identity: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1, max_length=256)


class SessionPublic(BaseModel):
    """Public session payload returned to clients."""

    model_config = ConfigDict(populate_by_name=True)

    session_id: str
    user_id: str
    expires_at: datetime


class AuthUserPublic(BaseModel):
    """Safe user payload for API responses."""

    user_id: str
    username: str
    email: str | None = None
    phone_e164: str | None = None
    is_verified: bool


class AuthSuccessResponse(BaseModel):
    """Standard successful auth response envelope."""

    session: SessionPublic
    user: AuthUserPublic


class AuthIssuedResponse(BaseModel):
    """Auth response + raw bearer token for issuance paths."""

    access_token: str
    session: SessionPublic
    user: AuthUserPublic


class LogoutResponse(BaseModel):
    """Logout response payload."""

    status: str = "ok"


class VerificationSendRequest(BaseModel):
    """Request OTP issuance for channel and destination."""

    channel: str = Field(min_length=3, max_length=16)
    destination: str = Field(min_length=3, max_length=255)
    purpose: str = Field(default="signup", min_length=3, max_length=32)


class VerificationSendResponse(BaseModel):
    """Response for OTP send/resend operations."""

    verification_id: str
    channel: str
    destination_masked: str
    expires_in_seconds: int
    resend_available_in_seconds: int
    status: str = "sent"
    debug_code: str | None = None


class VerificationVerifyRequest(BaseModel):
    """Request OTP verification."""

    verification_id: str = Field(min_length=8, max_length=128)
    code: str = Field(min_length=4, max_length=10)


class VerificationResendRequest(BaseModel):
    """Request another OTP for an active verification id."""

    verification_id: str = Field(min_length=8, max_length=128)


class VerificationVerifyResponse(BaseModel):
    """OTP verification result payload."""

    verification_id: str
    verified: bool
    status: str


class SignupStepIdentityRequest(BaseModel):
    """Signup flow step: identity."""

    username: str = Field(min_length=3, max_length=40)


class SignupStepContactRequest(BaseModel):
    """Signup flow step: contact."""

    flow_id: str = Field(min_length=8, max_length=128)
    email: str | None = None
    phone_e164: str | None = None


class SignupStepVerificationRequest(BaseModel):
    """Signup flow step: verification proof."""

    flow_id: str = Field(min_length=8, max_length=128)
    verification_id: str = Field(min_length=8, max_length=128)


class SignupStepDobRequest(BaseModel):
    """Signup flow step: date of birth."""

    flow_id: str = Field(min_length=8, max_length=128)
    date_of_birth: str = Field(min_length=8, max_length=16)


class SignupCompleteRequest(BaseModel):
    """Signup flow completion payload."""

    flow_id: str = Field(min_length=8, max_length=128)
    password: str = Field(min_length=10, max_length=256)


class SignupFlowStateResponse(BaseModel):
    """Current signup flow server state."""

    flow_id: str
    current_step: str
    completed_steps: list[str]
    username: str | None = None
    email: str | None = None
    phone_e164: str | None = None
    date_of_birth: str | None = None


class RecoverRequest(BaseModel):
    """Recover initiation request."""

    identity: str = Field(min_length=3, max_length=255)


class RecoverRequestResponse(BaseModel):
    """Generic anti-enumeration response for recover init."""

    status: str = "accepted"
    message: str = "If the account exists, recovery instructions were sent."
    recover_id: str | None = None
    debug_code: str | None = None


class RecoverVerifyRequest(BaseModel):
    """Verify recover OTP and issue reset token."""

    recover_id: str = Field(min_length=8, max_length=128)
    code: str = Field(min_length=4, max_length=10)


class RecoverVerifyResponse(BaseModel):
    """Recover verification response."""

    status: str
    reset_token: str | None = None


class RecoverResetRequest(BaseModel):
    """Reset password request using issued reset token."""

    recover_id: str = Field(min_length=8, max_length=128)
    reset_token: str = Field(min_length=12, max_length=256)
    new_password: str = Field(min_length=10, max_length=256)


class RecoverResetResponse(BaseModel):
    """Reset completion response."""

    status: str = "password_reset"


# ################################ /TYPES ################################
