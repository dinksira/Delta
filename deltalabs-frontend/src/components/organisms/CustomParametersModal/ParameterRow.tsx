/** ################################ COMPONENT ############################# */
/** One editable name/value pair inside CustomParametersModal. */

import React from "react";

import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Trash2 } from "lucide-react";

import type { CustomParameter } from "./CustomParametersModal.types";
import { rowClasses, rowErrorClasses, rowFieldsClasses, rowRemoveClasses } from "./variants";

/** Props for {@link ParameterRow}. */
export interface ParameterRowProps {
  /** The row being edited. */
  row: CustomParameter;
  /** Validation message for this row, if any. */
  error: string | undefined;
  /** Updates one field. */
  onChange: (id: string, field: "name" | "value", next: string) => void;
  /** Removes the row. */
  onRemove: (id: string) => void;
}

/** A labelled name/value pair with its own removal control. */
export function ParameterRow({ row, error, onChange, onRemove }: Readonly<ParameterRowProps>) {
  const nameId = `${row.id}-name`;
  const valueId = `${row.id}-value`;
  const errorId = `${row.id}-error`;

  return (
    <div className={rowClasses}>
      <button
        type="button"
        onClick={() => onRemove(row.id)}
        aria-label={`Remove parameter${row.name.trim() ? ` ${row.name.trim()}` : ""}`}
        className={rowRemoveClasses}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>

      <div className={rowFieldsClasses}>
        <Field id={nameId} label="Parameter name">
          <Input
            id={nameId}
            value={row.name}
            placeholder="Session length"
            onChange={(event) => onChange(row.id, "name", event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </Field>

        <Field id={valueId} label="Parameter value">
          <Input
            id={valueId}
            value={row.value}
            placeholder="90 minutes"
            onChange={(event) => onChange(row.id, "value", event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
        </Field>
      </div>

      {error ? (
        <p id={errorId} role="alert" className={rowErrorClasses}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
