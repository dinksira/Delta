"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
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
  useAuthResponseBanner,
} from "@/components/features/auth";
import { authErrorMessage } from "@/lib/authErrors";
import { useLoginMutation } from "@/modules/Feed/hooks";

type LoginPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  forgotHref?: string;
  switchSignupHref?: string;
  /** After a successful sign-in, navigate here (e.g. drop `?auth=login` for the modal). Defaults to `/`. */
  redirectAfterLoginHref?: string;
}>;

export function LoginPageView({
  showBack = false,
  backHref = "/",
  closeHref = "/",
  forgotHref = "/login?auth=recover",
  switchSignupHref = "/signup",
  redirectAfterLoginHref = "/",
}: LoginPageViewProps) {
  const router = useRouter();
  const [banner, setBanner] = useAuthResponseBanner();
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});
  const loginMutation = useLoginMutation();
  const isSubmitting = loginMutation.isPending;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const identifier = String(formData.get("login-identifier") ?? "").trim();
    const password = String(formData.get("login-password") ?? "").trim();
    const rememberMe = formData.get("remember-me") === "on";

    const next: { identifier?: string; password?: string } = {};
    if (!identifier) next.identifier = "Required";
    if (!password) next.password = "Required";
    if (next.identifier || next.password) {
      setFieldErrors(next);
      setBanner(null);
      return;
    }

    setFieldErrors({});
    try {
      await loginMutation.mutateAsync({
        identifier,
        password,
        rememberMe,
      });
      router.replace(redirectAfterLoginHref);
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, "Sign-in failed. Please try again."),
      });
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
      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        <AuthTextField
          id="login-identifier"
          label="Email or phone number"
          placeholder="mail@abc.com"
          errorMessage={fieldErrors.identifier}
          inputProps={{ name: "login-identifier", disabled: isSubmitting }}
        />
        <AuthPasswordField
          id="login-password"
          label="Password"
          placeholder="********"
          errorMessage={fieldErrors.password}
          inputProps={{ name: "login-password", disabled: isSubmitting }}
        />
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <AuthCheckboxField id="remember-me" label="Remember Me" />
          <Link
            href={forgotHref}
            className="shrink-0 text-sm font-semibold text-auth-link-secondary transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-auth-modal-surface rounded-sm"
          >
            Forgot Password?
          </Link>
        </div>
        <AuthPrimaryButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in..." : "Login"}
        </AuthPrimaryButton>
      </form>

      <div className="mt-6 space-y-4">
        <AuthDivider text="Or Sign in with" />
        <SocialProvidersRow mode="signin" />
      </div>

      <div className="mt-6">
        <AuthBottomSwitchLink mode="to_signup" href={switchSignupHref} />
      </div>
    </AuthModalShell>
  );
}
