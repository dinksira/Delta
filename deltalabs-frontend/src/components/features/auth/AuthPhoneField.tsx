import type { InputHTMLAttributes } from "react";

import { AUTH_FIELD_LABEL_CLASS } from "@/components/features/auth/authFormClasses";
import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input } from "@/components/theme";

type AuthPhoneFieldProps = Readonly<{
  id: string;
  label: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "inputMode" | "autoComplete" | "className">;
}>;

export function AuthPhoneField({ id, label, placeholder, error, errorMessage, inputProps }: AuthPhoneFieldProps) {
  const invalid = !!(error || errorMessage);
  return (
    <Field id={id} label={label} labelClassName={AUTH_FIELD_LABEL_CLASS} errorMessage={errorMessage}>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        className={getAuthInputClassName({ error: invalid })}
        aria-invalid={invalid}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        {...inputProps}
      />
    </Field>
  );
}
