export const LOCALE_STORAGE_KEY = "deltalabs.locale";

export const SUPPORTED_LOCALES = ["en", "am"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_LABELS: Record<AppLocale, string> = {
  en: "English",
  am: "አማርኛ",
};

export const DEFAULT_LOCALE: AppLocale = "en";

export function parseStoredLocale(raw: string | null): AppLocale {
  if (raw === "am") return "am";
  /* Legacy locales from older builds → default to English */
  return "en";
}
