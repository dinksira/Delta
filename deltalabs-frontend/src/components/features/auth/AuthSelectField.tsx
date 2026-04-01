import type { SelectHTMLAttributes } from "react";

import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field, Select } from "@/components/theme";

type Option = Readonly<{ value: string; label: string }>;

type AuthSelectFieldProps = Readonly<{
  id: string;
  label: string;
  options: readonly Option[];
  placeholder?: string;
  error?: boolean;
  selectProps?: Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "children">;
}>;

export function AuthSelectField({
  id,
  label,
  options,
  placeholder,
  error,
  selectProps,
}: AuthSelectFieldProps) {
  return (
    <Field id={id} label={label}>
      <Select id={id} className={getAuthInputClassName({ error, className: "cursor-pointer" })} {...selectProps}>
        {placeholder ? (
          <option value="" disabled>
            {placeholder}
          </option>
        ) : null}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </Select>
    </Field>
  );
}
