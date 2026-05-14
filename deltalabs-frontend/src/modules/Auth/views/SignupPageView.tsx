"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import {
  AuthBottomSwitchLink,
  AuthDivider,
  AuthModalShell,
  AuthPasswordField,
  AuthPhoneField,
  AuthPrimaryButton,
  AuthSelectField,
  AuthStatusBanner,
  AuthTextField,
  SocialProvidersRow,
  useAuthResponseBanner,
} from "@/components/features/auth";
import { authApi } from "@/modules/Auth/api/authApi";
import { authErrorMessage } from "@/lib/authErrors";
import { useAuthMessages } from "@/i18n/LocaleContext";
import { useSignupMutation } from "@/modules/Auth/hooks";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SignupPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  switchSigninHref?: string;
  /** After successful signup (session established). Defaults to `/`. */
  redirectAfterSignupHref?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function SignupPageView({
  showBack = true,
  backHref = "/",
  closeHref = "/",
  switchSigninHref = "/login",
  redirectAfterSignupHref = "/",
}: SignupPageViewProps) {
  const a = useAuthMessages();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useAuthResponseBanner();
  const signupMutation = useSignupMutation();
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const isSubmitting = signupMutation.isPending || isSendingVerification;
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    email: "",
    phone: "",
    otp: "",
    day: "",
    month: "",
    year: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const isFirstStep = step === 0;
  const isLastStep = step === 4;
  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    [],
  );
  const monthOptions = useMemo(
    () => a.signup.months.map((month, idx) => ({ value: String(idx + 1), label: month })),
    [a],
  );
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: String(year), label: String(year) };
      }),
    [],
  );

  const nextLabel = isLastStep
    ? a.signup.nextLabelCreate
    : step === 1
      ? a.signup.nextLabelContinue
      : a.signup.nextLabelNext;
  const backTarget = isFirstStep ? backHref : "#";

  const goBack = () => {
    if (step > 0) {
      setStep((value) => value - 1);
      setBanner(null);
      setFieldErrors({});
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;

    const readForm = (name: string): string => {
      const el = form.elements.namedItem(name);
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) return el.value;
      return "";
    };

    const nextFieldErrors: Record<string, string> = {};

    if (step === 0) {
      if (!values.firstName.trim()) nextFieldErrors.firstName = a.common.required;
      if (!values.lastName.trim()) nextFieldErrors.lastName = a.common.required;
      if (!values.userName.trim()) nextFieldErrors.userName = a.common.required;

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
    }

    if (step === 1) {
      if (!values.day) nextFieldErrors.day = a.common.required;
      if (!values.month) nextFieldErrors.month = a.common.required;
      if (!values.year) nextFieldErrors.year = a.common.required;

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
    }

    if (step === 2) {
      const phoneRaw = readForm("signup-phone");
      const emailRaw = readForm("signup-email");
      const phoneOk = /^\+?[0-9\s-]{9,15}$/.test(phoneRaw.trim());
      if (!phoneOk) nextFieldErrors.phone = a.signup.invalidPhone;
      if (!emailValid(emailRaw)) nextFieldErrors.email = a.signup.invalidEmail;

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
      setValues((prev) => ({ ...prev, phone: phoneRaw.trim(), email: emailRaw.trim() }));
    }

    if (step === 3) {
      const otpRaw = readForm("signup-otp");
      const otpOk = /^[0-9]{4,6}$/.test(otpRaw.trim());
      if (!otpOk) nextFieldErrors.otp = a.signup.invalidOtp;

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
      setValues((prev) => ({ ...prev, otp: otpRaw.trim() }));
    }

    if (step === 4) {
      const passwordRaw = readForm("signup-password");
      const confirmRaw = readForm("signup-confirm-password");
      if (passwordRaw.trim().length < 10) {
        nextFieldErrors.password = a.signup.passwordMin10;
      } else if (!/[a-z]/.test(passwordRaw)) {
        nextFieldErrors.password = a.signup.passwordLower;
      } else if (!/[A-Z]/.test(passwordRaw)) {
        nextFieldErrors.password = a.signup.passwordUpper;
      } else if (!/[0-9]/.test(passwordRaw)) {
        nextFieldErrors.password = a.signup.passwordNumber;
      }
      if (passwordRaw !== confirmRaw) {
        nextFieldErrors.confirmPassword = a.signup.passwordMismatch;
      }

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
      setValues((prev) => ({
        ...prev,
        password: passwordRaw,
        confirmPassword: confirmRaw,
      }));
    }

    setFieldErrors({});
    setBanner(null);

    if (!isLastStep) {
      if (step === 2) {
        try {
          setIsSendingVerification(true);
          const issued = await authApi.sendSignupVerification({
            email: values.email,
            phone: values.phone,
          });
          setVerificationId(issued.verificationId);
          setStep((value) => value + 1);
          if (issued.debugCode) {
            setBanner({
              type: "info",
              message: `${a.signup.verificationSentDev} ${issued.debugCode}`,
            });
          } else {
            setBanner({ type: "success", message: a.signup.verificationSent });
          }
        } catch (error) {
          setBanner({
            type: "error",
            message: authErrorMessage(error, a.signup.verificationSendFailed),
          });
        } finally {
          setIsSendingVerification(false);
        }
        return;
      }
      setStep((value) => value + 1);
      if (step === 3) {
        setBanner({ type: "success", message: a.signup.contactVerified });
      }
      return;
    }

    try {
      await signupMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        userName: values.userName,
        email: values.email,
        phone: values.phone,
        otp: values.otp,
        day: values.day,
        month: values.month,
        year: values.year,
        password: readForm("signup-password"),
        verificationId: verificationId ?? undefined,
      });
      router.replace(redirectAfterSignupHref);
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, a.signup.signupFailed),
      });
    }
  };

  return (
    <AuthModalShell
      title={a.signup.steps[step]!.title}
      subtitle={a.signup.steps[step]!.subtitle}
      showBack={showBack}
      backHref={backTarget}
      closeHref={closeHref}
      onBackClick={step > 0 ? goBack : undefined}
      banner={banner ? <AuthStatusBanner type={banner.type} message={banner.message} /> : undefined}
    >
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        {step === 0 ? (
          <>
            <AuthTextField
              id="first-name"
              label={a.signup.firstName}
              placeholder={a.signup.placeholderFirst}
              errorMessage={fieldErrors.firstName}
              inputProps={{
                value: values.firstName,
                onChange: (e) => setValues((prev) => ({ ...prev, firstName: e.target.value })),
              }}
            />
            <AuthTextField
              id="last-name"
              label={a.signup.lastName}
              placeholder={a.signup.placeholderLast}
              errorMessage={fieldErrors.lastName}
              inputProps={{
                value: values.lastName,
                onChange: (e) => setValues((prev) => ({ ...prev, lastName: e.target.value })),
              }}
            />
            <AuthTextField
              id="user-name"
              label={a.signup.userName}
              placeholder={a.signup.placeholderUserName}
              errorMessage={fieldErrors.userName}
              inputProps={{
                value: values.userName,
                onChange: (e) => setValues((prev) => ({ ...prev, userName: e.target.value })),
              }}
            />
          </>
        ) : null}

        {step === 1 ? (
          <div className="grid grid-cols-3 gap-3">
            <AuthSelectField
              id="birth-day"
              label={a.signup.day}
              options={dayOptions}
              placeholder={a.signup.placeholderDay}
              errorMessage={fieldErrors.day}
              selectProps={{
                value: values.day,
                onChange: (e) => setValues((prev) => ({ ...prev, day: e.target.value })),
              }}
            />
            <AuthSelectField
              id="birth-month"
              label={a.signup.month}
              options={monthOptions}
              placeholder={a.signup.placeholderMonth}
              errorMessage={fieldErrors.month}
              selectProps={{
                value: values.month,
                onChange: (e) => setValues((prev) => ({ ...prev, month: e.target.value })),
              }}
            />
            <AuthSelectField
              id="birth-year"
              label={a.signup.year}
              options={yearOptions}
              placeholder={a.signup.placeholderYear}
              errorMessage={fieldErrors.year}
              selectProps={{
                value: values.year,
                onChange: (e) => setValues((prev) => ({ ...prev, year: e.target.value })),
              }}
            />
          </div>
        ) : null}

        {step === 2 ? (
          <>
            <AuthPhoneField
              id="signup-phone"
              label={a.signup.phone}
              placeholder={a.signup.phonePlaceholder}
              errorMessage={fieldErrors.phone}
              inputProps={{
                name: "signup-phone",
                value: values.phone,
                onChange: (e) => {
                  setVerificationId(null);
                  setValues((prev) => ({ ...prev, phone: e.target.value }));
                },
              }}
            />
            <AuthTextField
              id="signup-email"
              label={a.signup.email}
              type="email"
              placeholder={a.login.emailPlaceholder}
              errorMessage={fieldErrors.email}
              inputProps={{
                name: "signup-email",
                autoComplete: "email",
                value: values.email,
                onChange: (e) => {
                  setVerificationId(null);
                  setValues((prev) => ({ ...prev, email: e.target.value }));
                },
              }}
            />
          </>
        ) : null}

        {step === 3 ? (
          <AuthTextField
            id="signup-otp"
            label={a.signup.otp}
            placeholder={a.signup.otpPlaceholder}
            errorMessage={fieldErrors.otp}
            inputProps={{
              name: "signup-otp",
              inputMode: "numeric",
              maxLength: 6,
              value: values.otp,
              onChange: (e) => setValues((prev) => ({ ...prev, otp: e.target.value })),
            }}
          />
        ) : null}

        {step === 4 ? (
          <>
            <AuthPasswordField
              id="signup-password"
              label={a.signup.passwordCreate}
              placeholder={a.signup.placeholderCreatePassword}
              errorMessage={fieldErrors.password}
              inputProps={{
                name: "signup-password",
                value: values.password,
                onChange: (e) => setValues((prev) => ({ ...prev, password: e.target.value })),
              }}
            />
            <AuthPasswordField
              id="signup-confirm-password"
              label={a.signup.passwordConfirm}
              placeholder={a.signup.placeholderConfirmPassword}
              errorMessage={fieldErrors.confirmPassword}
              inputProps={{
                name: "signup-confirm-password",
                value: values.confirmPassword,
                onChange: (e) => setValues((prev) => ({ ...prev, confirmPassword: e.target.value })),
              }}
            />
          </>
        ) : null}

        <AuthPrimaryButton type="submit" primaryVariant="solid" className="mt-2" disabled={isSubmitting}>
          {nextLabel}
        </AuthPrimaryButton>
      </form>

      <div className="mt-6 space-y-4">
        <AuthDivider text={a.common.orSignUpWith} />
        <SocialProvidersRow mode="signup" />
      </div>

      <div className="mt-6">
        <AuthBottomSwitchLink mode="to_signin" href={switchSigninHref} />
      </div>
    </AuthModalShell>
  );
}
/** ################################ /COMPONENT ############################# */
