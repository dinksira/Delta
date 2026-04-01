import { ApiError } from "@/lib/apiClient";
import type {
  AuthResult,
  LoginInput,
  RecoverRequestInput,
  ResetPasswordInput,
  SignupInput,
} from "@/modules/Feed/types/auth";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Minimal auth API contract layer.
 * Replace mock internals with apiClient calls once backend endpoints are ready.
 */
export const authApi = {
  async login(input: LoginInput): Promise<AuthResult> {
    await delay(250);
    if (input.identifier === "fail@demo.com" || input.password === "wrong") {
      throw new ApiError("Invalid credentials", { status: 401, code: "INVALID_CREDENTIALS" });
    }
    return { ok: true, message: "Login submitted. API integration will complete final sign-in." };
  },

  async signup(input: SignupInput): Promise<AuthResult> {
    await delay(300);
    if (input.password.length < 8) {
      throw new ApiError("Password too short", { status: 400, code: "PASSWORD_TOO_SHORT" });
    }
    return { ok: true, message: "Signup data collected. API integration will complete account creation." };
  },

  async requestRecover(input: RecoverRequestInput): Promise<AuthResult> {
    await delay(250);
    if (!input.identifier.trim()) {
      throw new ApiError("Missing identifier", { status: 400, code: "MISSING_IDENTIFIER" });
    }
    return { ok: true, message: "Verification code sent. Please check your inbox." };
  },

  async resetPassword(input: ResetPasswordInput): Promise<AuthResult> {
    await delay(250);
    if (!input.newPassword || !input.confirmPassword || input.newPassword !== input.confirmPassword) {
      throw new ApiError("Password mismatch", { status: 400, code: "PASSWORD_MISMATCH" });
    }
    return { ok: true, message: "Password reset success. Login again with your new credentials." };
  },
} as const;
