"use client";

import Link from "next/link";
import { useState } from "react";

import {
  AuthBottomSwitchLink,
  AuthCheckboxField,
  AuthDivider,
  AuthModalShell,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthStatusBanner,
  AuthTextField,
  SocialProvidersRow,
} from "@/components/features/auth";
import { useLoginMutation } from "@/modules/Feed/hooks";

type LoginPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  forgotHref?: string;
  switchSignupHref?: string;
}>;

export function LoginPageView({
  showBack = false,
  backHref = "/",
  closeHref = "/",
  forgotHref = "/login?auth=recover",
  switchSignupHref = "/signup",
}: LoginPageViewProps) {
  const [banner, setBanner] = useState<null | { type: "error" | "info"; message: string }>(null);
  const loginMutation = useLoginMutation();
  const isSubmitting = loginMutation.isLoading;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("login-identifier") ?? "").trim();
    const password = String(formData.get("login-password") ?? "").trim();

    if (!identifier || !password) {
      setBanner({ type: "error", message: "Please enter both identifier and password." });
      return;
    }

    try {
      const result = await loginMutation.mutateAsync({
        identifier,
        password,
      });
      setBanner({ type: "info", message: result.message });
    } catch {
      setBanner({ type: "error", message: "Something went wrong. Please check your credentials and try again." });
    }
  };

  return (
    <AuthModalShell
      title="Login to Your Account"
      subtitle="Learn more and do more"
      showBack={showBack}
      backHref={backHref}
      closeHref={closeHref}
      banner={banner ? <AuthStatusBanner type={banner.type} message={banner.message} /> : undefined}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <AuthTextField
          id="login-identifier"
          label="Email or phone number"
          placeholder="mail@abc.com"
          inputProps={{ name: "login-identifier", disabled: isSubmitting }}
        />
        <AuthPasswordField
          id="login-password"
          label="Password"
          placeholder="********"
          inputProps={{ name: "login-password", disabled: isSubmitting }}
        />
        <div className="flex items-center justify-between">
          <AuthCheckboxField id="remember-me" label="Remember Me" />
          <Link
            href={forgotHref}
            className="text-sm font-semibold text-primary-700 hover:text-primary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 rounded-sm"
          >
            Forgot Password?
          </Link>
        </div>
        <AuthPrimaryButton type="submit" className="mt-1" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </AuthPrimaryButton>
      </form>

      <div className="mt-6 space-y-5">
        <AuthDivider text="Or Sign in with" />
        <SocialProvidersRow mode="signin" />
      </div>

      <AuthBottomSwitchLink mode="to_signup" href={switchSignupHref} />
    </AuthModalShell>
  );
}
