import { ApiError } from "@/lib/apiClient";
import {
  assertLoginInput,
  assertRecoverRequestInput,
  assertResetPasswordInput,
  assertSignupInput,
} from "@/modules/Auth/api/authValidation";
import {
  consumeRecoveryOtp,
  createUserFromSignup,
  findUserByEmail,
  findUserByIdentifier,
  findUserByUserName,
  MOCK_RECOVERY_OTP_DEMO,
  normalizeEmail,
  normalizePhone,
  setRecoveryOtp,
  toPublicUser,
  updateUserPassword,
  type MockUserRecord,
} from "@/modules/Auth/api/mockAuthStore";
import type {
  AuthResult,
  AuthSessionPayload,
  LoginInput,
  RecoverRequestInput,
  ResetPasswordInput,
  SignupInput,
} from "@/modules/Auth/types/auth";
import { AUTH_ERROR_CODES } from "@/modules/Auth/types/auth";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulated network latency (bounded). */
async function latency(): Promise<void> {
  const ms = 320 + Math.floor(Math.random() * 380);
  await delay(ms);
}

function buildSession(user: MockUserRecord, rememberMe?: boolean): AuthSessionPayload {
  const ttlMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return {
    accessToken: `mock.${user.id}.${Date.now()}`,
    expiresAt: Date.now() + ttlMs,
    user: toPublicUser(user),
  };
}

function issueSixDigitOtp(): string {
  return String(Math.floor(100_000 + Math.random() * 900_000));
}

/**
 * Mock auth API — validates like a real backend, persists users/recovery in localStorage.
 * Swap this module’s internals for `apiClient.post('/auth/...')` when the API is ready.
 */
export const authApi = {
  async login(input: LoginInput): Promise<AuthResult> {
    await latency();
    assertLoginInput(input);
    const user = findUserByIdentifier(input.identifier);
    if (!user || user.password !== input.password) {
      throw new ApiError("Invalid email, phone, or password.", {
        status: 401,
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
      });
    }
    return {
      ok: true,
      message: "Signed in successfully.",
      session: buildSession(user, input.rememberMe),
    };
  },

  async signup(input: SignupInput): Promise<AuthResult> {
    await latency();
    assertSignupInput(input);
    const email = normalizeEmail(input.email);
    const phone = normalizePhone(input.phone);
    if (findUserByEmail(email)) {
      throw new ApiError("An account with this email already exists.", {
        status: 409,
        code: AUTH_ERROR_CODES.USER_EXISTS,
        details: { field: "email" },
      });
    }
    if (findUserByUserName(input.userName)) {
      throw new ApiError("This username is already taken.", {
        status: 409,
        code: AUTH_ERROR_CODES.USER_EXISTS,
        details: { field: "userName" },
      });
    }
    const byPhone = findUserByIdentifier(phone);
    if (byPhone) {
      throw new ApiError("An account with this phone number already exists.", {
        status: 409,
        code: AUTH_ERROR_CODES.USER_EXISTS,
        details: { field: "phone" },
      });
    }
    const user = createUserFromSignup(input);
    return {
      ok: true,
      message: "Account created. You are now signed in.",
      session: buildSession(user, true),
    };
  },

  async requestRecover(input: RecoverRequestInput): Promise<AuthResult> {
    await latency();
    assertRecoverRequestInput(input.identifier);
    const user = findUserByIdentifier(input.identifier);
    if (user) {
      const otp = issueSixDigitOtp();
      setRecoveryOtp(input.identifier, otp, 15 * 60 * 1000);
    }
    return {
      ok: true,
      message: "If an account exists for this email or phone, a verification code was sent.",
    };
  },

  async resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
    await latency();
    assertResetPasswordInput(input);
    const user = findUserByIdentifier(input.identifier);
    if (!user) {
      throw new ApiError("Unable to reset password. Request a new code and try again.", {
        status: 400,
        code: AUTH_ERROR_CODES.USER_NOT_FOUND,
      });
    }
    const otpOk =
      consumeRecoveryOtp(input.identifier, input.otp) ||
      (input.otp.trim() === MOCK_RECOVERY_OTP_DEMO && !!user);
    if (!otpOk) {
      throw new ApiError("Invalid or expired verification code.", {
        status: 400,
        code: AUTH_ERROR_CODES.INVALID_OTP,
      });
    }
    updateUserPassword(user.id, input.newPassword);
    return {
      ok: true,
      message: "Password updated. You can sign in with your new password.",
    };
  },
} as const;
