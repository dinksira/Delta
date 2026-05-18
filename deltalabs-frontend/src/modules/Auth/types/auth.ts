/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Client + mock-API shared auth contracts. Backend swap should preserve shapes. */

export type AuthBannerType = "success" | "error" | "info";

export const AUTH_ERROR_CODES = {
  IDENTIFIER_REQUIRED: "IDENTIFIER_REQUIRED",
  PASSWORD_REQUIRED: "PASSWORD_REQUIRED",
  PASSWORD_TOO_SHORT: "PASSWORD_TOO_SHORT",
  VALIDATION_FAILED: "VALIDATION_FAILED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  USER_EXISTS: "USER_EXISTS",
  USER_NOT_FOUND: "USER_NOT_FOUND",
  INVALID_OTP: "INVALID_OTP",
  OTP_EXPIRED: "OTP_EXPIRED",
  PASSWORD_MISMATCH: "PASSWORD_MISMATCH",
  RATE_LIMITED: "RATE_LIMITED",
  SERVER_ERROR: "SERVER_ERROR",
} as const;

export type AuthErrorCode = (typeof AUTH_ERROR_CODES)[keyof typeof AUTH_ERROR_CODES];

export type AuthenticatedUser = Readonly<{
  id: string;
  username: string;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  avatarUrl: string | null;
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
}>;

export type AuthSessionPayload = Readonly<{
  accessToken: string;
  expiresAt: number;
  user: AuthenticatedUser;
}>;

export type AccountHistoryItem = {
  user: AuthenticatedUser;
  accessToken: string;
  expiresAt: number;
};

export type LoginInput = Readonly<{
  identifier: string;
  password: string;
  rememberMe?: boolean;
}>;

export type SignupInput = Readonly<{
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string;
  otp: string;
  verificationId?: string;
  day: string;
  month: string;
  year: string;
  password: string;
}>;

export type RecoverRequestInput = Readonly<{
  identifier: string;
}>;

export type RecoverVerifyInput = Readonly<{
  identifier: string;
  otp: string;
}>;

export type ResetPasswordInput = Readonly<{
  identifier: string;
  newPassword: string;
  confirmPassword: string;
}>;

export type AuthResult = Readonly<{
  ok: true;
  message: string;
  /** Present after login and signup when the user is signed in. */
  session?: AuthSessionPayload;
}>;
/** ################################ /COMPONENT ############################# */
