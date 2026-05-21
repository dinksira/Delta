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
  const resetMutation = useResetPasswordMutation();
  const [stage, setStage] = useState<"request" | "reset" | "done">("request");
  const [identifier, setIdentifier] = useState("");
  const [identifierError, setIdentifierError] = useState<string | undefined>();
  const [banner, setBanner] = useAuthResponseBanner();

  const title = useMemo(() => {
    if (stage === "request") return a.recover.titleRequest;
    if (stage === "reset") return a.recover.titleReset;
    return a.recover.titleDone;
  }, [stage, a]);

  const subtitle = useMemo(() => {
    if (stage === "request") return a.recover.subtitleRequest;
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
      setBanner({ type: "success", message: result.message });
      setStage("reset");
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, a.recover.recoverFailed),
      });
    }
  };

  const handleReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const password = String(form.get("reset-password") ?? "");
    const confirm = String(form.get("confirm-password") ?? "");
    const otp = readOtpFromForm(formEl, "reset-otp");
    try {
      const result = await resetMutation.mutateAsync({
        identifier,
        otp,
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

      {stage === "reset" ? (
        <form className="flex flex-col gap-4" onSubmit={handleReset}>
          <AuthOtpField label={a.recover.otpLabel} name="reset-otp" />
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
