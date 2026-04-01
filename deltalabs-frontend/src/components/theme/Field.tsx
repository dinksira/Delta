import type { ReactNode } from "react";

import { Typography } from "@/components/theme/Typography";
import { cx } from "@/components/theme/utils";

type FieldProps = Readonly<{
  id: string;
  label: string;
  className?: string;
  children: ReactNode;
}>;

/** Shared label + control wrapper for forms across features. */
export function Field({ id, label, className, children }: FieldProps) {
  return (
    <label htmlFor={id} className={cx("flex flex-col gap-2", className)}>
      <Typography as="span" variant="label" className="text-text-primary">
        {label}
      </Typography>
      {children}
    </label>
  );
}
