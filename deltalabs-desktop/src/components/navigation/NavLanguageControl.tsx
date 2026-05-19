"use client";

import { useEffect, useRef, useState } from "react";

import { LOCALE_LABELS, SUPPORTED_LOCALES, type AppLocale } from "@/i18n/constants";
import { useAuthMessages, useLocale } from "@/i18n/LocaleContext";

const ICON_STROKE = 1.65;

function GlobeIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r={9} stroke="currentColor" strokeWidth={ICON_STROKE} />
      <path
        d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

const utilityGlyphClass = "size-8 shrink-0";

type NavLanguageControlProps = Readonly<{
  /** Teal header rail (white glyphs). */
  tone?: "onPrimary";
}>;

/** Header language picker: opens a menu and persists choice to `localStorage`. */
export function NavLanguageControl({ tone = "onPrimary" }: NavLanguageControlProps) {
  const { locale, setLocale } = useLocale();
  const a = useAuthMessages();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const triggerClass =
    tone === "onPrimary"
      ? "inline-flex h-10 items-center gap-2 rounded-md px-1.5 text-base leading-none text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[17px]"
      : "inline-flex h-10 items-center gap-2 rounded-md border border-border-default px-2 text-sm text-text-primary hover:bg-surface-muted";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className={triggerClass}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${a.nav.chooseLanguage}: ${LOCALE_LABELS[locale]}`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <GlobeIcon className={`${utilityGlyphClass} opacity-90`} />
        <span className="leading-none">{LOCALE_LABELS[locale]}</span>
      </button>
      {open ? (
        <ul
          className="absolute end-0 top-full z-[200] mt-1 min-w-[11rem] rounded-lg border border-slate-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
          role="listbox"
          aria-label={a.nav.chooseLanguage}
        >
          {SUPPORTED_LOCALES.map((code) => {
            const selected = code === locale;
            return (
              <li key={code} role="none">
                <button
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className={[
                    "flex w-full items-center px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-100",
                    selected ? "bg-primary-50 font-semibold text-primary-800" : "font-medium",
                  ].join(" ")}
                  onClick={() => {
                    setLocale(code as AppLocale);
                    setOpen(false);
                  }}
                >
                  {LOCALE_LABELS[code]}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
