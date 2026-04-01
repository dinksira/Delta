"use client";

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
import { authErrorMessage } from "@/lib/authErrors";
import { useSignupMutation } from "@/modules/Feed/hooks";

type SignupPageViewProps = Readonly<{
  showBack?: boolean;
  backHref?: string;
  closeHref?: string;
  switchSigninHref?: string;
  /** After successful signup (session established). Defaults to `/`. */
  redirectAfterSignupHref?: string;
}>;

const emailValid = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export function SignupPageView({
  showBack = true,
  backHref = "/",
  closeHref = "/",
  switchSigninHref = "/login",
  redirectAfterSignupHref = "/",
}: SignupPageViewProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [banner, setBanner] = useAuthResponseBanner();
  const signupMutation = useSignupMutation();
  const isSubmitting = signupMutation.isPending;
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
    () =>
      [
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
    "Enter your Date of birth",
    "Phone and email",
    "Verification code",
    "Set your password",
  ] as const;

  const subtitleByStep = [
    "Learn More, Do More",
    "Your age information helps personalize your experience",
    "We'll use these to send your verification code",
    "Enter the code we sent to your phone and email",
    "Secure your account",
  ] as const;

  const nextLabel = isLastStep ? "Create account" : step === 1 ? "Continue" : "Next";
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
      if (!values.firstName.trim()) nextFieldErrors.firstName = "Required";
      if (!values.lastName.trim()) nextFieldErrors.lastName = "Required";
      if (!values.userName.trim()) nextFieldErrors.userName = "Required";

      if (Object.keys(nextFieldErrors).length > 0) {
        setFieldErrors(nextFieldErrors);
        setBanner(null);
        return;
      }
    }

    if (step === 1) {
      if (!values.day) nextFieldErrors.day = "Required";
      if (!values.month) nextFieldErrors.month = "Required";
      if (!values.year) nextFieldErrors.year = "Required";

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
      if (!phoneOk) nextFieldErrors.phone = "Invalid phone number";
      if (!emailValid(emailRaw)) nextFieldErrors.email = "Invalid email address";

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
      if (!otpOk) nextFieldErrors.otp = "Invalid verification code";

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
      if (passwordRaw.trim().length < 8) {
        nextFieldErrors.password = "At least 8 characters";
      } else if (!/[a-z]/.test(passwordRaw)) {
        nextFieldErrors.password = "Include a lowercase letter";
      } else if (!/[A-Z]/.test(passwordRaw)) {
        nextFieldErrors.password = "Include an uppercase letter";
      } else if (!/[0-9]/.test(passwordRaw)) {
        nextFieldErrors.password = "Include a number";
      }
      if (passwordRaw !== confirmRaw) {
        nextFieldErrors.confirmPassword = "Passwords do not match";
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
      setStep((value) => value + 1);
      if (step === 2) {
        setBanner({ type: "success", message: "Code is sent to your phone via SMS" });
      } else if (step === 3) {
        setBanner({ type: "success", message: "Contact verified. Continue to the next step." });
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
      });
      router.replace(redirectAfterSignupHref);
    } catch (error) {
      setBanner({
        type: "error",
        message: authErrorMessage(error, "Could not create your account. Please try again."),
      });
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
              errorMessage={fieldErrors.firstName}
              inputProps={{
                value: values.firstName,
                onChange: (e) => setValues((prev) => ({ ...prev, firstName: e.target.value })),
              }}
            />
            <AuthTextField
              id="last-name"
              label="Last Name"
              placeholder="Bekele"
              errorMessage={fieldErrors.lastName}
              inputProps={{
                value: values.lastName,
                onChange: (e) => setValues((prev) => ({ ...prev, lastName: e.target.value })),
              }}
            />
            <AuthTextField
              id="user-name"
              label="User Name"
              placeholder="Enter User Name"
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
              label="Day"
              options={dayOptions}
              placeholder="Day"
              errorMessage={fieldErrors.day}
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
              errorMessage={fieldErrors.month}
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
              label="Phone number"
              placeholder="+251 9xx xxx xxx"
              errorMessage={fieldErrors.phone}
              inputProps={{
                name: "signup-phone",
                value: values.phone,
                onChange: (e) => setValues((prev) => ({ ...prev, phone: e.target.value })),
              }}
            />
            <AuthTextField
              id="signup-email"
              label="Email"
              type="email"
              placeholder="mail@abc.com"
              errorMessage={fieldErrors.email}
              inputProps={{
                name: "signup-email",
                autoComplete: "email",
                value: values.email,
                onChange: (e) => setValues((prev) => ({ ...prev, email: e.target.value })),
              }}
            />
          </>
        ) : null}

        {step === 3 ? (
          <AuthTextField
            id="signup-otp"
            label="Verification code"
            placeholder="Enter 4-6 digit code"
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
              label="Password"
              placeholder="Create password"
              errorMessage={fieldErrors.password}
              inputProps={{
                name: "signup-password",
                value: values.password,
                onChange: (e) => setValues((prev) => ({ ...prev, password: e.target.value })),
              }}
            />
            <AuthPasswordField
              id="signup-confirm-password"
              label="Confirm Password"
              placeholder="Confirm password"
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
        <AuthDivider text="Or Sign up with" />
        <SocialProvidersRow mode="signup" />
      </div>

      <div className="mt-6">
        <AuthBottomSwitchLink mode="to_signin" href={switchSigninHref} />
      </div>
    </AuthModalShell>
  );
}
