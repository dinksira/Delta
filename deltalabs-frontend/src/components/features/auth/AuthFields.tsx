import type { InputHTMLAttributes } from "react";

import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input, Typography } from "@/components/theme";

type AuthTextFieldProps = Readonly<{
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  error?: boolean;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "placeholder" | "className">;
}>;

export function AuthTextField({
  id,
  label,
  type = "text",
  placeholder,
  error,
  inputProps,
}: AuthTextFieldProps) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        className={getAuthInputClassName({ error })}
        {...inputProps}
      />
    </Field>
  );
}

export function AuthCheckboxField({
  id,
  label,
  defaultChecked = false,
}: Readonly<{
  id: string;
  label: string;
  defaultChecked?: boolean;
}>) {
  return (
    <label htmlFor={id} className="inline-flex items-center gap-2">
      <input id={id} type="checkbox" defaultChecked={defaultChecked} className="h-4 w-4 accent-primary-600" />
      <Typography as="span" variant="small" className="text-text-secondary">
        {label}
      </Typography>
    </label>
  );
}
