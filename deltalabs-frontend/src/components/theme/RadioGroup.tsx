/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { InputHTMLAttributes } from "react";

import { Typography } from "@/components/theme/Typography";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export type RadioOption = Readonly<{
  value: string;
  label: string;
  id: string;
  inputProps?: Omit<InputHTMLAttributes<HTMLInputElement>, "id" | "name" | "type" | "value" | "className">;
}>;

export type RadioGroupProps = Readonly<{
  name: string;
  legend: string;
  options: readonly RadioOption[];
  error?: boolean;
  className?: string;
  optionClassName?: string;
}>;

/** Shared radio-group primitive for feature forms. */
export function RadioGroup({
  name,
  legend,
  options,
  error,
  className,
  optionClassName,
}: RadioGroupProps) {
  return (
    <fieldset className={cx("flex flex-col gap-3 border-0 p-0", className)}>
      <legend>
        <Typography as="span" variant="label" className="text-text-primary">
          {legend}
        </Typography>
      </legend>
      <div className="flex flex-col gap-2" role="radiogroup" aria-invalid={error ? true : undefined}>
        {options.map((opt) => (
          <label
            key={opt.id}
            htmlFor={opt.id}
            className={cx(
              "inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-default bg-surface-default px-3 py-2",
              "has-[:checked]:border-primary-400 has-[:checked]:ring-1 has-[:checked]:ring-primary-200",
              optionClassName,
            )}
          >
            <input id={opt.id} name={name} type="radio" value={opt.value} className="h-4 w-4 accent-primary-600" {...opt.inputProps} />
            <Typography as="span" variant="small" className="text-text-primary">
              {opt.label}
            </Typography>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
/** ################################ /COMPONENT ############################# */
