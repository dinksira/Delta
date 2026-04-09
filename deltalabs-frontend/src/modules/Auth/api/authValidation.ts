/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/**
 * Server-shaped validation for mock auth API (mirror future backend rules).
 */
import { ApiError } from "@/lib/apiClient";
import type { LoginInput, ResetPasswordInput, SignupInput } from "@/modules/Auth/types/auth";
import { AUTH_ERROR_CODES } from "@/modules/Auth/types/auth";

const EMAIL_LIKE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_LIKE = /^\+?[0-9]{9,15}$/;
const USERNAME_LIKE = /^[a-zA-Z0-9_.-]{3,40}$/;

export function assertValidIdentifier(identifier: string, field = "identifier"): void {
  const v = identifier.trim();
  if (!v) {
    throw new ApiError("Email or phone number is required.", {
      status: 400,
      code: AUTH_ERROR_CODES.IDENTIFIER_REQUIRED,
      details: { field },
    });
  }
  const compact = v.replace(/\s/g, "");
  const looksEmail = EMAIL_LIKE.test(v);
  const looksPhone = PHONE_LIKE.test(compact);
  const looksUsername = USERNAME_LIKE.test(v);
  if (!looksEmail && !looksPhone && !looksUsername) {
    throw new ApiError("Enter a valid email address, phone number, or username.", {
      status: 400,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { field },
    });
  }
}

export function assertLoginInput(input: LoginInput): void {
  assertValidIdentifier(input.identifier, "identifier");
  const pw = input.password ?? "";
  if (!pw) {
    throw new ApiError("Password is required.", {
      status: 400,
      code: AUTH_ERROR_CODES.PASSWORD_REQUIRED,
      details: { field: "password" },
    });
  }
  if (pw.length < 8) {
    throw new ApiError("Password must be at least 8 characters.", {
      status: 400,
      code: AUTH_ERROR_CODES.PASSWORD_TOO_SHORT,
      details: { field: "password" },
    });
  }
}

const OTP_LIKE = /^[0-9]{4,8}$/;

export function assertSignupInput(input: SignupInput): void {
  const fields: string[] = [];
  if (!input.firstName.trim()) fields.push("firstName");
  if (!input.lastName.trim()) fields.push("lastName");
  if (!input.userName.trim()) fields.push("userName");
  if (!input.email.trim()) fields.push("email");
  if (!input.phone.trim()) fields.push("phone");
  if (!input.day || !input.month || !input.year) fields.push("dateOfBirth");
  if (!input.otp.trim()) fields.push("otp");
  if (!input.password) fields.push("password");

  if (fields.length > 0) {
    throw new ApiError("Please complete all required fields.", {
      status: 422,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { fields },
    });
  }

  if (!EMAIL_LIKE.test(input.email.trim())) {
    throw new ApiError("Enter a valid email address.", {
      status: 422,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { field: "email" },
    });
  }

  const phone = input.phone.replace(/\s/g, "");
  if (!PHONE_LIKE.test(phone)) {
    throw new ApiError("Enter a valid phone number.", {
      status: 422,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { field: "phone" },
    });
  }

  if (!OTP_LIKE.test(input.otp.trim())) {
    throw new ApiError("Enter a valid verification code.", {
      status: 422,
      code: AUTH_ERROR_CODES.INVALID_OTP,
      details: { field: "otp" },
    });
  }

  if (input.password.length < 10) {
    throw new ApiError("Password must be at least 10 characters.", {
      status: 422,
      code: AUTH_ERROR_CODES.PASSWORD_TOO_SHORT,
      details: { field: "password" },
    });
  }

  if (!/[a-z]/.test(input.password) || !/[A-Z]/.test(input.password) || !/[0-9]/.test(input.password)) {
    throw new ApiError("Password must include uppercase, lowercase, and a number.", {
      status: 422,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { field: "password" },
    });
  }
}

export function assertRecoverRequestInput(identifier: string): void {
  assertValidIdentifier(identifier, "identifier");
}

export function assertResetPasswordInput(input: ResetPasswordInput): void {
  assertValidIdentifier(input.identifier, "identifier");
  if (!input.otp.trim()) {
    throw new ApiError("Verification code is required.", {
      status: 400,
      code: AUTH_ERROR_CODES.INVALID_OTP,
      details: { field: "otp" },
    });
  }
  if (!OTP_LIKE.test(input.otp.trim())) {
    throw new ApiError("Enter a valid verification code.", {
      status: 400,
      code: AUTH_ERROR_CODES.INVALID_OTP,
      details: { field: "otp" },
    });
  }
  const np = input.newPassword ?? "";
  const cp = input.confirmPassword ?? "";
  if (!np || !cp) {
    throw new ApiError("Password fields are required.", {
      status: 400,
      code: AUTH_ERROR_CODES.VALIDATION_FAILED,
      details: { field: "password" },
    });
  }
  if (np.length < 10) {
    throw new ApiError("Password must be at least 10 characters.", {
      status: 400,
      code: AUTH_ERROR_CODES.PASSWORD_TOO_SHORT,
      details: { field: "password" },
    });
  }
  if (np !== cp) {
    throw new ApiError("Passwords do not match.", {
      status: 400,
      code: AUTH_ERROR_CODES.PASSWORD_MISMATCH,
      details: { field: "confirmPassword" },
    });
  }
}
/** ################################ /COMPONENT ############################# */
