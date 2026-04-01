"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AuthBottomSwitchLink,
  AuthDivider,
  AuthModalShell,
  AuthOtpField,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthStatusBanner,
  AuthTextField,
} from "@/components/features/auth";
import {
  useRecoverRequestMutation,
  useResetPasswordMutation,
} from "@/modules/Feed/hooks";

type RecoverPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  switchSignupHref?: string;
}>;

export function RecoverPageView({
  showBack = true,
  backHref = "/login",
  closeHref = "/",
  switchSignupHref = "/signup",
}: RecoverPageViewProps) {
  const router = useRouter();
  const recoverMutation = useRecoverRequestMutation();
  const resetMutation = useResetPasswordMutation();
  const [stage, setStage] = useState<"request" | "reset" | "done">("request");
  const [identifier, setIdentifier] = useState("");
  const [banner, setBanner] = useState<
    | null
    | { type: "success"; message: string }
    | { type: "error"; message: string }
    | { type: "info"; message: string }
  >(null);

  const title = useMemo(() => {
    if (stage === "request") return "Recover your account";
    if (stage === "reset") return "Reset your password";
    return "Password reset complete";
  }, [stage]);

  const subtitle = useMemo(() => {
    if (stage === "request") return "Learn more and do more";
    if (stage === "reset") return "Create a new secure password";
    return "You can now login with your new password";
  }, [stage]);

  const handleRecover = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setBanner({ type: "error", message: "Please enter your email or phone number." });
      return;
    }
    try {
      const result = await recoverMutation.mutateAsync({ identifier });
      setBanner({ type: "success", message: result.message });
      setStage("reset");
    } catch {
      setBanner({ type: "error", message: "Failed to send recovery code. Please try again." });
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("reset-password") ?? "");
    const confirm = String(form.get("confirm-password") ?? "");
    const otp = String(form.get("reset-otp") ?? "");
    try {
      const result = await resetMutation.mutateAsync({
        otp,
        newPassword: password,
        confirmPassword: confirm,
      });
      setBanner({ type: "success", message: result.message });
      setStage("done");
    } catch {
      setBanner({ type: "error", message: "Password mismatch. Please make sure both values match." });
    }
  };

  const handleBack = () => {
    if (stage === "done") {
      setStage("reset");
      setBanner(null);
      return;
    }
    if (stage === "reset") {
      setStage("request");
      setBanner(null);
    }
  };

  return (
    <AuthModalShell
      title={title}
      subtitle={subtitle}
      showBack={showBack}
      backHref={backHref}
      onBackClick={stage === "request" ? undefined : handleBack}
      closeHref={closeHref}
      banner={banner ? <AuthStatusBanner type={banner.type} message={banner.message} /> : undefined}
    >
      {stage === "request" ? (
        <form className="flex flex-col gap-4" onSubmit={handleRecover}>
          <AuthTextField
            id="recover-identifier"
            label="Email or phone number"
            placeholder="mail@abc.com"
            inputProps={{
              value: identifier,
              onChange: (e) => setIdentifier(e.target.value),
              disabled: recoverMutation.isLoading,
            }}
          />
          <AuthPrimaryButton type="submit" className="mt-1" disabled={recoverMutation.isLoading}>
            Recover
          </AuthPrimaryButton>
        </form>
      ) : null}

      {stage === "reset" ? (
        <form className="flex flex-col gap-4" onSubmit={handleReset}>
          <AuthOtpField label="Verification code" name="reset-otp" />
          <AuthPasswordField
            id="reset-password"
            label="New password"
            placeholder="Create new password"
            inputProps={{ name: "reset-password" }}
          />
          <AuthPasswordField
            id="confirm-password"
            label="Confirm password"
            placeholder="Confirm your password"
            inputProps={{ name: "confirm-password" }}
          />
          <AuthPrimaryButton type="submit" className="mt-1" disabled={resetMutation.isLoading}>
            Reset password
          </AuthPrimaryButton>
        </form>
      ) : null}

      {stage === "done" ? (
        <div className="space-y-4">
          <p className="text-center text-base text-text-secondary">
            Your password has been updated. Continue to sign in and access your account.
          </p>
          <AuthPrimaryButton type="button" className="mt-1" onClick={() => router.push(backHref)}>
            Go to login
          </AuthPrimaryButton>
        </div>
      ) : null}

      <div className="mt-6 space-y-5">
        <AuthDivider text={stage === "request" ? "Or Sign in with" : "Need help?"} />
      </div>

      <AuthBottomSwitchLink mode="to_signup" href={switchSignupHref} />
    </AuthModalShell>
  );
}
