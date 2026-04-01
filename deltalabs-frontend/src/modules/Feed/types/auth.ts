export type AuthBannerType = "success" | "error" | "info";

export type LoginInput = Readonly<{
  identifier: string;
  password: string;
  rememberMe?: boolean;
}>;

export type SignupInput = Readonly<{
  firstName: string;
  lastName: string;
  userName: string;
  phone: string;
  otp: string;
  day: string;
  month: string;
  year: string;
  password: string;
}>;

export type RecoverRequestInput = Readonly<{
  identifier: string;
}>;

export type ResetPasswordInput = Readonly<{
  otp: string;
  newPassword: string;
  confirmPassword: string;
}>;

export type AuthResult = Readonly<{
  ok: boolean;
  message: string;
}>;
