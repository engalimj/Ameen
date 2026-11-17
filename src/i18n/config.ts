// To add a language (for example Urdu or Bengali): add a JSON file next to
// ar.json / en.json with the same keys, then add one entry here. No screen changes.
export const LOCALES = {
  ar: { label: "العربية", dir: "rtl", intl: "ar-SA-u-nu-latn" },
  en: { label: "English", dir: "ltr", intl: "en-GB" },
} as const;

export type Locale = keyof typeof LOCALES;
export const DEFAULT_LOCALE: Locale = "ar";
export const LOCALE_COOKIE = "lang";

export function isLocale(v: unknown): v is Locale {
  return typeof v === "string" && v in LOCALES;
}
