"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useCallback, useId, useRef, type KeyboardEvent, type ClipboardEvent } from "react";

import { AUTH_FIELD_LABEL_CLASS } from "@/components/features/auth/authFormClasses";
import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const CELL_COUNT = 6;

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type AuthOtpFieldProps = Readonly<{
  label: string;
  error?: boolean;
  errorMessage?: string;
  name?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AuthOtpField({ label, error, errorMessage, name = "otp" }: AuthOtpFieldProps) {
  const baseId = useId();
  const invalid = !!(error || errorMessage);
  const errorId = errorMessage ? `${baseId}-otp-error` : undefined;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = useCallback((index: number) => {
    const el = inputsRef.current[index];
    el?.focus();
    el?.select();
  }, []);

  const handleChange = useCallback(
    (index: number, value: string) => {
      const digit = value.replace(/\D/g, "").slice(-1);
      const el = inputsRef.current[index];
      if (el) el.value = digit;
      if (digit && index < CELL_COUNT - 1) {
        focusAt(index + 1);
      }
    },
    [focusAt],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Backspace" && !e.currentTarget.value && index > 0) {
        focusAt(index - 1);
      }
      if (e.key === "ArrowLeft" && index > 0) {
        e.preventDefault();
        focusAt(index - 1);
      }
      if (e.key === "ArrowRight" && index < CELL_COUNT - 1) {
        e.preventDefault();
        focusAt(index + 1);
      }
    },
    [focusAt],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, CELL_COUNT);
      if (!text) return;
      e.preventDefault();
      text.split("").forEach((ch, i) => {
        const el = inputsRef.current[i];
        if (el) el.value = ch;
      });
      focusAt(Math.min(text.length, CELL_COUNT - 1));
    },
    [focusAt],
  );

  return (
    <fieldset className="flex flex-col gap-1.5 border-0 p-0" aria-describedby={errorId}>
      <legend className="w-full px-0">
        <div className="flex items-center justify-between gap-3">
          <span className={AUTH_FIELD_LABEL_CLASS}>{label}</span>
          {errorMessage ? (
            <span id={errorId} role="alert" className="shrink-0 text-right text-sm font-normal text-error-500">
              {errorMessage}
            </span>
          ) : null}
        </div>
      </legend>
      <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label={label}>
        {Array.from({ length: CELL_COUNT }, (_, index) => (
          <input
            key={`${baseId}-${index}`}
            ref={(el) => {
              inputsRef.current[index] = el;
            }}
            id={`${baseId}-otp-${index}`}
            name={`${name}-${index}`}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            autoComplete={index === 0 ? "one-time-code" : "off"}
            aria-label={`Digit ${index + 1} of ${CELL_COUNT}`}
            aria-invalid={invalid}
            className={getAuthInputClassName({ error: invalid, className: "w-10 text-center sm:w-11" })}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}
/** ################################ /COMPONENT ############################# */
