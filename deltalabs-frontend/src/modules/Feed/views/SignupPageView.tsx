"use client";

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
} from "@/components/features/auth";
import { useSignupMutation } from "@/modules/Feed/hooks";

type SignupPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  switchSigninHref?: string;
}>;

export function SignupPageView({
  showBack = true,
  backHref = "/",
  closeHref = "/",
  switchSigninHref = "/login",
}: SignupPageViewProps) {
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useState<null | { type: "error" | "success" | "info"; message: string }>(null);
  const signupMutation = useSignupMutation();
  const isSubmitting = signupMutation.isLoading;
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    userName: "",
    phone: "",
    otp: "",
    day: "",
    month: "",
    year: "",
    password: "",
    confirmPassword: "",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const isFirstStep = step === 0;
  const isLastStep = step === 3;
  const dayOptions = useMemo(
    () => Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
    [],
  );
  const monthOptions = useMemo(
    () => [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ].map((month, idx) => ({ value: String(idx + 1), label: month })),
    [],
  );
  const yearOptions = useMemo(
    () =>
      Array.from({ length: 80 }, (_, i) => {
        const year = new Date().getFullYear() - i;
        return { value: String(year), label: String(year) };
      }),
    [],
  );

  const titleByStep = [
    "Create Your Account",
    "Verify your contact",
    "Enter your Date of birth",
    "Set your password",
  ] as const;
  const subtitleByStep = [
    "Learn More, Do More",
    "We'll send an OTP code",
    "Your age information helps personalize your experience",
    "Secure your account",
  ] as const;

  const nextLabel = isLastStep ? "Create account" : step === 2 ? "Continue" : "Next";
  const backTarget = isFirstStep ? backHref : "#";

  const goBack = () => {
    if (step > 0) {
      setStep((value) => value - 1);
      setBanner(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const nextFieldErrors: Record<string, boolean> = {};
    const phoneValid = /^\+?[0-9\s-]{9,15}$/.test(values.phone.trim());
    const otpValid = /^[0-9]{4,6}$/.test(values.otp.trim());

    if (step === 0) {
      nextFieldErrors.firstName = !values.firstName.trim();
      nextFieldErrors.lastName = !values.lastName.trim();
      nextFieldErrors.userName = !values.userName.trim();

      if (nextFieldErrors.firstName || nextFieldErrors.lastName || nextFieldErrors.userName) {
        setFieldErrors(nextFieldErrors);
        setBanner({ type: "error", message: "Please complete first name, last name, and user name." });
        return;
      }
    }

    if (step === 1) {
      nextFieldErrors.phone = !phoneValid;
      nextFieldErrors.otp = !otpValid;

      if (nextFieldErrors.phone || nextFieldErrors.otp) {
        setFieldErrors(nextFieldErrors);
        setBanner({ type: "error", message: "Enter a valid phone number and OTP code." });
        return;
      }
    }

    if (step === 2) {
      nextFieldErrors.day = !values.day;
      nextFieldErrors.month = !values.month;
      nextFieldErrors.year = !values.year;

      if (nextFieldErrors.day || nextFieldErrors.month || nextFieldErrors.year) {
        setFieldErrors(nextFieldErrors);
        setBanner({ type: "error", message: "Please select complete date of birth values." });
        return;
      }
    }

    if (step === 3) {
      nextFieldErrors.password = values.password.trim().length < 8;
      nextFieldErrors.confirmPassword = values.password !== values.confirmPassword;

      if (nextFieldErrors.password || nextFieldErrors.confirmPassword) {
        setFieldErrors(nextFieldErrors);
        setBanner({
          type: "error",
          message: nextFieldErrors.confirmPassword
            ? "Password mismatch. Please make sure both values match."
            : "Password must be at least 8 characters.",
        });
        return;
      }
    }

    setFieldErrors({});
    setBanner(null);

    if (!isLastStep) {
      setStep((value) => value + 1);
      if (step === 1) {
        setBanner({ type: "success", message: "Contact verified. Continue to the next step." });
      }
      return;
    }

    try {
      const result = await signupMutation.mutateAsync({
        firstName: values.firstName,
        lastName: values.lastName,
        userName: values.userName,
        phone: values.phone,
        otp: values.otp,
        day: values.day,
        month: values.month,
        year: values.year,
        password: values.password,
      });
      setBanner({ type: "info", message: result.message });
    } catch {
      setBanner({ type: "error", message: "Something went wrong while creating your account." });
    }
  };

  return (
    <AuthModalShell
      title={titleByStep[step]}
      subtitle={subtitleByStep[step]}
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
              label="First Name"
              placeholder="Abel"
              error={fieldErrors.firstName}
              inputProps={{
                value: values.firstName,
                onChange: (e) => setValues((prev) => ({ ...prev, firstName: e.target.value })),
              }}
            />
            <AuthTextField
              id="last-name"
              label="Last Name"
              placeholder="Bekele"
              error={fieldErrors.lastName}
              inputProps={{
                value: values.lastName,
                onChange: (e) => setValues((prev) => ({ ...prev, lastName: e.target.value })),
              }}
            />
            <AuthTextField
              id="user-name"
              label="User Name"
              placeholder="Enter User Name"
              error={fieldErrors.userName}
              inputProps={{
                value: values.userName,
                onChange: (e) => setValues((prev) => ({ ...prev, userName: e.target.value })),
              }}
            />
          </>
        ) : null}
        {step === 1 ? (
          <>
            <AuthPhoneField
              id="signup-phone"
              label="Phone number"
              placeholder="+251 9xx xxx xxx"
              error={fieldErrors.phone}
              inputProps={{
                value: values.phone,
                onChange: (e) => setValues((prev) => ({ ...prev, phone: e.target.value })),
              }}
            />
            <AuthTextField
              id="signup-otp"
              label="Verification code"
              placeholder="Enter 4-6 digit code"
              error={fieldErrors.otp}
              inputProps={{
                inputMode: "numeric",
                maxLength: 6,
                value: values.otp,
                onChange: (e) => setValues((prev) => ({ ...prev, otp: e.target.value })),
              }}
            />
          </>
        ) : null}
        {step === 2 ? (
          <div className="grid grid-cols-3 gap-3">
            <AuthSelectField
              id="birth-day"
              label="Day"
              options={dayOptions}
              placeholder="Day"
              error={fieldErrors.day}
              selectProps={{
                value: values.day,
                onChange: (e) => setValues((prev) => ({ ...prev, day: e.target.value })),
              }}
            />
            <AuthSelectField
              id="birth-month"
              label="Month"
              options={monthOptions}
              placeholder="Month"
              error={fieldErrors.month}
              selectProps={{
                value: values.month,
                onChange: (e) => setValues((prev) => ({ ...prev, month: e.target.value })),
              }}
            />
            <AuthSelectField
              id="birth-year"
              label="Year"
              options={yearOptions}
              placeholder="Year"
              error={fieldErrors.year}
              selectProps={{
                value: values.year,
                onChange: (e) => setValues((prev) => ({ ...prev, year: e.target.value })),
              }}
            />
          </div>
        ) : null}
        {step === 3 ? (
          <>
            <AuthPasswordField
              id="signup-password"
              label="Password"
              placeholder="Create password"
              error={fieldErrors.password}
              inputProps={{
                value: values.password,
                onChange: (e) => setValues((prev) => ({ ...prev, password: e.target.value })),
              }}
            />
            <AuthPasswordField
              id="signup-confirm-password"
              label="Confirm Password"
              placeholder="Confirm password"
              error={fieldErrors.confirmPassword}
              inputProps={{
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

      <div className="mt-6 space-y-5">
        <AuthDivider text="Or Sign up with" />
        <SocialProvidersRow mode="signup" />
      </div>

      <AuthBottomSwitchLink mode="to_signin" href={switchSigninHref} />
    </AuthModalShell>
  );
}
