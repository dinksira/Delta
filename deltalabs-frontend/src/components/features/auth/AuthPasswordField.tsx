"use client";

import { useId, useState } from "react";
import type { InputHTMLAttributes } from "react";

import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Input } from "@/components/theme";

type AuthPasswordFieldProps = Readonly<{
  id?: string;
  label: string;
  placeholder?: string;
  error?: boolean;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "type" | "placeholder" | "className">;
}>;

export function AuthPasswordField({ id: idProp, label, placeholder, error, inputProps }: AuthPasswordFieldProps) {
  const genId = useId();
  const id = idProp ?? genId;
  const [visible, setVisible] = useState(false);

  return (
    <Field id={id} label={label}>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete="current-password"
          className={getAuthInputClassName({ error, className: "pr-12" })}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs font-semibold text-primary-700 hover:bg-primary-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          aria-pressed={visible}
          aria-label={visible ? "Hide password" : "Show password"}
        >
          {visible ? "Hide" : "Show"}
        </button>
      </div>
    </Field>
  );
}
