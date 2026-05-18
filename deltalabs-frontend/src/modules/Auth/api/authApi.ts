/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { ApiError, apiClient } from "@/lib/apiClient";
import {
  assertLoginInput,
  assertRecoverRequestInput,
  assertRecoverVerifyInput,
  assertResetPasswordInput,
  assertSignupInput,
} from "@/modules/Auth/api/authValidation";
import type {
  AuthResult,
  AuthSessionPayload,
  LoginInput,
  RecoverRequestInput,
  RecoverVerifyInput,
  ResetPasswordInput,
  SignupInput,
} from "@/modules/Auth/types/auth";
import { AUTH_ERROR_CODES } from "@/modules/Auth/types/auth";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type AuthIssuedResponseDto = Readonly<{
  access_token: string;
  session: {
    session_id: string;
    user_id: string;
    expires_at: string;
  };
  user: {
    user_id: string;
    username: string;
    full_name: string | null;
    email: string | null;
    phone_e164: string | null;
    bio: string | null;
    avatar_url: string | null;
    followers_count: number;
    following_count: number;
    is_verified: boolean;
  };
}>;

type RecoverRequestResponseDto = Readonly<{
  status: string;
  message: string;
  recover_id?: string | null;
  debug_code?: string | null;
}>;

type RecoverVerifyResponseDto = Readonly<{
  status: string;
  reset_token?: string | null;
}>;

type SignupFlowStateResponseDto = Readonly<{
  flow_id: string;
  current_step: string;
  completed_steps: readonly string[];
  username?: string | null;
  email?: string | null;
  phone_e164?: string | null;
  date_of_birth?: string | null;
}>;

type VerificationSendResponseDto = Readonly<{
  verification_id: string;
  status: string;
  debug_code?: string | null;
}>;

type VerificationVerifyResponseDto = Readonly<{
  verification_id: string;
  verified: boolean;
  status: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ HELPERS ############################# */
const recoverIdByIdentifier = new Map<string, string>();
const resetTokenByIdentifier = new Map<string, string>();

function normalizePhoneE164Like(value: string): string {
  return value.replace(/\s+/g, "");
}

function toDateOfBirthIso(input: SignupInput): string {
  const year = input.year.padStart(4, "0");
  const month = input.month.padStart(2, "0");
  const day = input.day.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapIssuedResponseToSession(dto: AuthIssuedResponseDto): AuthSessionPayload {
  return {
    accessToken: dto.access_token,
    expiresAt: Date.parse(dto.session.expires_at) || Date.now() + 24 * 60 * 60 * 1000,
    user: {
      id: dto.user.user_id,
      username: dto.user.username,
      fullName: dto.user.full_name,
      email: dto.user.email,
      phone: dto.user.phone_e164,
      bio: dto.user.bio,
      avatarUrl: dto.user.avatar_url,
      followersCount: dto.user.followers_count,
      followingCount: dto.user.following_count,
      isVerified: dto.user.is_verified,
    },
  };
}
/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */

/** Real backend auth API integration. */
export const authApi = {
  async login(input: LoginInput): Promise<AuthResult> {
    assertLoginInput(input);
    const data = await apiClient.post<AuthIssuedResponseDto>("/v1/auth/login", {
      json: { identity: input.identifier, password: input.password },
    });
    return {
      ok: true,
      message: "Signed in successfully.",
      session: mapIssuedResponseToSession(data),
    };
  },

  async sendSignupVerification(input: Pick<SignupInput, "email" | "phone">): Promise<{
    verificationId: string;
    debugCode?: string;
  }> {
    const destination = input.email.trim() || normalizePhoneE164Like(input.phone.trim());
    const channel = input.email.trim() ? "email" : "sms";
    const data = await apiClient.post<VerificationSendResponseDto>("/v1/auth/verification/send", {
      json: {
        channel,
        destination,
        purpose: "signup",
      },
    });
    return {
      verificationId: data.verification_id,
      debugCode: data.debug_code ?? undefined,
    };
    
  },

  async signup(input: SignupInput): Promise<AuthResult> {
    assertSignupInput(input);

    const identity = await apiClient.post<SignupFlowStateResponseDto>("/v1/auth/signup/step/identity", {
      json: {
        username: input.username,
      },
    });

    const contact = await apiClient.post<SignupFlowStateResponseDto>("/v1/auth/signup/step/contact", {
      json: {
        flow_id: identity.flow_id,
        email: input.email.trim() || null,
        phone_e164: normalizePhoneE164Like(input.phone.trim()) || null,
      },
    });

    const verificationId =
      input.verificationId ??
      (
        await authApi.sendSignupVerification({
          email: input.email,
          phone: input.phone,
        })
      ).verificationId;

    const verification = await apiClient.post<VerificationVerifyResponseDto>(
      "/v1/auth/verification/verify",
      {
        json: {
          verification_id: verificationId,
          code: input.otp.trim(),
        },
      },
    );
    if (!verification.verified) {
      throw new ApiError("Verification failed. Please request a new code.", {
        status: 400,
        code: AUTH_ERROR_CODES.INVALID_OTP,
      });
    }

    await apiClient.post<SignupFlowStateResponseDto>("/v1/auth/signup/step/verification", {
      json: {
        flow_id: contact.flow_id,
        verification_id: verification.verification_id,
      },
    });

    await apiClient.post<SignupFlowStateResponseDto>("/v1/auth/signup/step/dob", {
      json: {
        flow_id: contact.flow_id,
        date_of_birth: toDateOfBirthIso(input),
      },
    });

    const data = await apiClient.post<AuthIssuedResponseDto>("/v1/auth/signup/complete", {
      json: {
        flow_id: contact.flow_id,
        password: input.password,
      },
    });
    return {
      ok: true,
      message: "Account created. You are now signed in.",
      session: mapIssuedResponseToSession(data),
    };
  },

  async requestRecover(input: RecoverRequestInput): Promise<AuthResult> {
    assertRecoverRequestInput(input.identifier);
    const data = await apiClient.post<RecoverRequestResponseDto>("/v1/auth/recover/request", {
      json: { identity: input.identifier },
    });
    if (data.recover_id) {
      recoverIdByIdentifier.set(input.identifier.trim().toLowerCase(), data.recover_id);
    }
    return {
      ok: true,
      message: data.message || "If an account exists, recovery instructions were sent.",
    };
  },

  async verifyRecover(input: RecoverVerifyInput): Promise<AuthResult> {
    assertRecoverVerifyInput(input);
    const key = input.identifier.trim().toLowerCase();
    const recoverId = recoverIdByIdentifier.get(key);
    if (!recoverId) {
      throw new ApiError("Start recovery first to receive a verification code.", {
        status: 400,
        code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      });
    }
    const verify = await apiClient.post<RecoverVerifyResponseDto>("/v1/auth/recover/verify", {
      json: { recover_id: recoverId, code: input.otp },
    });
    if (!verify.reset_token) {
      throw new ApiError("Invalid or expired verification code.", {
        status: 400,
        code: AUTH_ERROR_CODES.INVALID_OTP,
      });
    }
    resetTokenByIdentifier.set(key, verify.reset_token);
    return {
      ok: true,
      message: "Code verified. You can set a new password.",
    };
  },

  async resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
    assertResetPasswordInput(input);
    const key = input.identifier.trim().toLowerCase();
    const recoverId = recoverIdByIdentifier.get(key);
    const resetToken = resetTokenByIdentifier.get(key);
    if (!recoverId || !resetToken) {
      throw new ApiError("Verify your recovery code before setting a new password.", {
        status: 400,
        code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      });
    }
    await apiClient.post<{ status: string }>("/v1/auth/recover/reset", {
      json: {
        recover_id: recoverId,
        reset_token: resetToken,
        new_password: input.newPassword,
      },
    });
    recoverIdByIdentifier.delete(key);
    resetTokenByIdentifier.delete(key);
    return {
      ok: true,
      message: "Password updated. You can sign in with your new password.",
    };
  },
} as const;
/** ################################ /COMPONENT ############################# */
