import type { InputHTMLAttributes } from "react";

import { AUTH_FIELD_LABEL_CLASS } from "@/components/features/auth/authFormClasses";
import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input, Typography } from "@/components/theme";

type AuthTextFieldProps = Readonly<{
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "placeholder" | "className">;
}>;

export function AuthTextField({
  id,
  label,
  type = "text",
  placeholder,
  error,
  errorMessage,
  inputProps,
}: AuthTextFieldProps) {
  const invalid = !!(error || errorMessage);
  return (
    <Field id={id} label={label} labelClassName={AUTH_FIELD_LABEL_CLASS} errorMessage={errorMessage}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={getAuthInputClassName({ error: invalid })}
        aria-invalid={invalid}
        aria-describedby={errorMessage ? `${id}-error` : undefined}
        {...inputProps}
      />
    </Field>
  );
}

export function AuthCheckboxField({
  id,
  label,
  name = "remember-me",
  defaultChecked = false,
}: Readonly<{
  id: string;
  label: string;
  name?: string;
  defaultChecked?: boolean;
}>) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        className="h-4 w-4 accent-primary-600"
      />
      <Typography as="span" variant="small" className="text-text-secondary">
        {label}
      </Typography>
    </label>
  );
}
