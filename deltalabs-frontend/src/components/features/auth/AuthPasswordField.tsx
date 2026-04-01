"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

import { AUTH_FIELD_LABEL_CLASS } from "@/components/features/auth/authFormClasses";
import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input } from "@/components/theme";

type AuthPasswordFieldProps = Readonly<{
  id?: string;
  label: string;
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "placeholder" | "className">;
}>;

export function AuthPasswordField({
  id: idProp,
  label,
  placeholder,
  error,
  errorMessage,
  inputProps,
}: AuthPasswordFieldProps) {
  const genId = useId();
  const id = idProp ?? genId;
  const [visible, setVisible] = useState(false);
  const invalid = !!(error || errorMessage);

  return (
    <Field id={id} label={label} labelClassName={AUTH_FIELD_LABEL_CLASS} errorMessage={errorMessage}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          className={getAuthInputClassName({ error: invalid, className: "pr-14" })}
          aria-invalid={invalid}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-1.5 py-0.5 text-xs font-medium text-text-secondary hover:bg-surface-muted hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
