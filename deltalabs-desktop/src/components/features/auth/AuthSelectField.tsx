"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ChangeEvent, SelectHTMLAttributes } from "react";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import { AUTH_FIELD_LABEL_CLASS } from "@/components/features/auth/authFormClasses";
import { getAuthInputClassName } from "@/components/features/auth/authInputStyles";
import { Field } from "@/components/theme";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type Option = Readonly<{ value: string; label: string }>;

type AuthSelectFieldProps = Readonly<{
  id: string;
  label: string;
  options: readonly Option[];
  placeholder?: string;
  error?: boolean;
  errorMessage?: string;
  selectProps?: Omit<SelectHTMLAttributes<HTMLSelectElement>, "id" | "className" | "children">;
}>;

/** ################################ /TYPES ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function ChevronDownIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <path
        d="M6 9l6 6 6-6"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function AuthSelectField({
  id,
  label,
  options,
  placeholder,
  error,
  errorMessage,
  selectProps,
}: AuthSelectFieldProps) {
  const invalid = !!(error || errorMessage);
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const { value: valueProp, onChange, disabled, name } = selectProps ?? {};
  const valueStr = valueProp === undefined || valueProp === null ? "" : String(valueProp);
  const selectedOption = options.find((o) => o.value === valueStr);
  const showPlaceholder = !valueStr;

  const emitChange = useCallback(
    (next: string) => {
      onChange?.({ target: { value: next } } as ChangeEvent<HTMLSelectElement>);
    },
    [onChange],
  );

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (event: MouseEvent) => {
      if (containerRef.current?.contains(event.target as Node)) return;
      close();
    };
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const toggle = () => {
    if (disabled) return;
    setOpen((o) => !o);
  };

  const pick = (next: string) => {
    emitChange(next);
    close();
  };

  const displayText = selectedOption?.label ?? placeholder ?? "";

  return (
    <Field id={id} label={label} labelClassName={AUTH_FIELD_LABEL_CLASS} errorMessage={errorMessage}>
      <div ref={containerRef} className="relative">
        <button
          type="button"
          id={id}
          name={name}
          disabled={disabled}
          aria-describedby={errorMessage ? `${id}-error` : undefined}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          className={cx(
            getAuthInputClassName({
              error: invalid,
              trailingControl: true,
              className: "flex min-w-0 cursor-pointer items-center text-left",
            }),
            showPlaceholder ? "text-auth-input-placeholder" : "text-text-primary",
          )}
          onClick={toggle}
          onKeyDown={(event) => {
            if (disabled) return;
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              toggle();
            }
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              setOpen(true);
            }
          }}
        >
          <span className="min-w-0 flex-1 truncate">{displayText}</span>
        </button>
        <span
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary"
          aria-hidden
        >
          <ChevronDownIcon />
        </span>
        {open ? (
          <ul
            id={listId}
            role="listbox"
            aria-labelledby={`${id}-label`}
            className={cx(
              "absolute z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border-default",
              "bg-auth-modal-surface py-1 shadow-lg ring-1 ring-black/5 dark:ring-white/10",
            )}
          >
            {options.map((opt) => {
              const selected = opt.value === valueStr;
              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={selected}
                  className={cx(
                    "cursor-pointer px-3 py-2 text-left text-sm",
                    selected
                      ? "bg-primary-600 font-medium text-text-inverse"
                      : "text-text-primary hover:bg-surface-muted",
                  )}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(opt.value)}
                >
                  {opt.label}
                </li>
              );
            })}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
/** ################################ /COMPONENT ############################# */
