"use client";

import { useCallback, useId, useRef, type KeyboardEvent, type ClipboardEvent } from "react";

import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Typography } from "@/components/theme";

const CELL_COUNT = 6;

type AuthOtpFieldProps = Readonly<{
  label: string;
  error?: boolean;
  name?: string;
}>;

export function AuthOtpField({ label, error, name = "otp" }: AuthOtpFieldProps) {
  const baseId = useId();
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
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend>
        <Typography as="span" variant="label" className="text-text-primary">
          {label}
        </Typography>
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
            className={getAuthInputClassName({ error, className: "w-10 text-center sm:w-11" })}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            onPaste={index === 0 ? handlePaste : undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}
