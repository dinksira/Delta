import type { InputHTMLAttributes } from "react";

import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input } from "@/components/theme";

type AuthPhoneFieldProps = Readonly<{
  id: string;
  label: string;
  placeholder?: string;
  error?: boolean;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "inputMode" | "autoComplete" | "className">;
}>;

export function AuthPhoneField({ id, label, placeholder, error, inputProps }: AuthPhoneFieldProps) {
  return (
    <Field id={id} label={label}>
      <Input
        id={id}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        placeholder={placeholder}
        className={getAuthInputClassName({ error })}
        {...inputProps}
      />
    </Field>
  );
}
