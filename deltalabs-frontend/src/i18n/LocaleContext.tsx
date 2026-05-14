"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";

import { authMessagesFor, type AuthMessages } from "@/i18n/authMessages";
import {
  DEFAULT_LOCALE,
  LOCALE_STORAGE_KEY,
  parseStoredLocale,
  type AppLocale,
} from "@/i18n/constants";

type LocaleContextValue = Readonly<{
  locale: AppLocale;
  setLocale: (next: AppLocale) => void;
  auth: AuthMessages;
}>;

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, setLocaleState] = useState<AppLocale>(DEFAULT_LOCALE);

  useLayoutEffect(() => {
    const stored = parseStoredLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
    setLocaleState(stored);
    document.documentElement.lang = stored;
  }, []);

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      setLocale,
      auth: authMessagesFor(locale),
    }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocaleContext(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocaleContext must be used within LocaleProvider");
  }
  return ctx;
}

export function useLocale(): Pick<LocaleContextValue, "locale" | "setLocale"> {
  const { locale, setLocale } = useLocaleContext();
  return { locale, setLocale };
}

/** Auth copy for the current locale (convenience). */
export function useAuthMessages(): AuthMessages {
  return useLocaleContext().auth;
}
