"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import {
  AuthBottomSwitchLink,
  AuthModalShell,
  AuthOtpField,
  AuthPasswordField,
  AuthPrimaryButton,
  AuthStatusBanner,
  AuthTextField,
  useAuthResponseBanner,
} from "@/components/features/auth";
import { authErrorMessage } from "@/lib/authErrors";
import { useAuthMessages } from "@/i18n/LocaleContext";
import {
  useRecoverRequestMutation,
  useRecoverVerifyMutation,
  useResetPasswordMutation,
} from "@/modules/Auth/hooks";

/** ################################ /IMPORT ############################# */
/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function readOtpFromForm(form: HTMLFormElement, namePrefix: string): string {
  let out = "";
  for (let i = 0; i < 6; i++) {
    const el = form.elements.namedItem(`${namePrefix}-${i}`);
    if (el instanceof HTMLInputElement) out += el.value;
  }
  return out;
}

/** ################################ /HELPERS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type RecoverPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  switchSignupHref?: string;
}>;

type RecoverStage = "request" | "verify" | "reset" | "done";

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function RecoverPageView({
  showBack = true,
  backHref = "/login",
  closeHref = "/",
  switchSignupHref = "/signup",
}: RecoverPageViewProps) {
  const a = useAuthMessages();
  const router = useRouter();
  const recoverMutation = useRecoverRequestMutation();
  const verifyMutation = useRecoverVerifyMutation();
  const resetMutation = useResetPasswordMutation();
  const [stage, setStage] = useState<RecoverStage>("request");
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState<string | undefined>();
  const [banner, setBanner] = useAuthResponseBanner();

  const title = useMemo(() => {
    if (stage === "request") return a.recover.titleRequest;
    if (stage === "verify") return a.recover.titleVerify;
    if (stage === "reset") return a.recover.titleReset;
    return a.recover.titleDone;
  }, [stage, a]);

  const subtitle = useMemo(() => {
    if (stage === "request") return a.recover.subtitleRequest;
    if (stage === "verify") return a.recover.subtitleVerify;
    if (stage === "reset") return a.recover.subtitleReset;
    return a.recover.subtitleDone;
  }, [stage, a]);

  const handleRecover = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!identifier.trim()) {
      setIdentifierError(a.common.required);
      setBanner(null);
      return;
    }
    setIdentifierError(undefined);
    try {
      const result = await recoverMutation.mutateAsync({ identifier });
      if (!result.recoverId) {
        setBanner({ type: "success", message: result.message });
        return;
      }
      setBanner({ type: "success", message: result.message });
      setStage("verify");
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, a.recover.emailDeliveryFailed),
      });
    }
  };

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otp = readOtpFromForm(event.currentTarget, "verify-otp");
    try {
      const result = await verifyMutation.mutateAsync({ identifier, otp });
      setBanner({ type: "success", message: result.message });
      setStage("reset");
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, a.recover.verifyFailed),
      });
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get("reset-password") ?? "");
    const confirm = String(form.get("confirm-password") ?? "");
    try {
      const result = await resetMutation.mutateAsync({
        identifier,
        newPassword: password,
        confirmPassword: confirm,
      });
      setBanner({ type: "success", message: result.message });
      setStage("done");
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, a.recover.resetFailed),
      });
    }
  };

  const handleBack = () => {
    if (stage === "done") {
      setStage("reset");
      setBanner(null);
      return;
    }
    if (stage === "reset") {
      setStage("verify");
      setBanner(null);
      return;
    }
    if (stage === "verify") {
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
            label={a.login.emailOrPhone}
            placeholder={a.login.emailPlaceholder}
            errorMessage={identifierError}
            inputProps={{
              value: identifier,
              onChange: (e) => {
                setIdentifier(e.target.value);
                setIdentifierError(undefined);
              },
              disabled: recoverMutation.isPending,
            }}
          />
          <AuthPrimaryButton type="submit" className="mt-1" disabled={recoverMutation.isPending}>
            {recoverMutation.isPending ? a.common.sending : a.recover.recover}
          </AuthPrimaryButton>
        </form>
      ) : null}

      {stage === "verify" ? (
        <form className="flex flex-col gap-4" onSubmit={handleVerify}>
          <AuthOtpField label={a.recover.otpLabel} name="verify-otp" />
          <AuthPrimaryButton type="submit" className="mt-1" disabled={verifyMutation.isPending}>
            {verifyMutation.isPending ? a.common.sending : a.recover.verifyCode}
          </AuthPrimaryButton>
        </form>
      ) : null}

      {stage === "reset" ? (
        <form className="flex flex-col gap-4" onSubmit={handleReset}>
          <AuthPasswordField
            id="reset-password"
            label={a.recover.newPassword}
            placeholder={a.recover.newPasswordPlaceholder}
            inputProps={{ name: "reset-password", disabled: resetMutation.isPending }}
          />
          <AuthPasswordField
            id="confirm-password"
            label={a.recover.confirmPassword}
            placeholder={a.recover.confirmPasswordPlaceholder}
            inputProps={{ name: "confirm-password", disabled: resetMutation.isPending }}
          />
          <AuthPrimaryButton type="submit" className="mt-1" disabled={resetMutation.isPending}>
            {resetMutation.isPending ? a.common.updating : a.recover.resetPassword}
          </AuthPrimaryButton>
        </form>
      ) : null}

      {stage === "done" ? (
        <div className="space-y-4">
          <p className="text-center text-base text-text-secondary">{a.recover.doneBody}</p>
          <AuthPrimaryButton type="button" className="mt-1" onClick={() => router.push(backHref)}>
            {a.recover.goToLogin}
          </AuthPrimaryButton>
        </div>
      ) : null}

      <div className="mt-6">
        <AuthBottomSwitchLink mode="to_signup" href={switchSignupHref} />
      </div>
    </AuthModalShell>
  );
}
/** ################################ /COMPONENT ############################# */
