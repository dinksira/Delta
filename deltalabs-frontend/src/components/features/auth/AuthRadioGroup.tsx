import type { InputHTMLAttributes } from "react";

import { RadioGroup } from "@/components/theme";

type RadioOption = Readonly<{
  value: string;
  label: string;
  id: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type" | "value" | "className">;
}>;

type AuthRadioGroupProps = Readonly<{
  name: string;
  legend: string;
  options: readonly RadioOption[];
  error?: boolean;
}>;

export function AuthRadioGroup({ name, legend, options, error }: AuthRadioGroupProps) {
  return (
    <RadioGroup
      name={name}
      legend={legend}
      options={options}
      error={error}
      optionClassName="border-auth-input-border bg-auth-input-bg"
    />
  );
}
