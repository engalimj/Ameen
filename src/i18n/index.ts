import "server-only";
import { cookies } from "next/headers";
import ar from "./ar.json";
import en from "./en.json";
import { DEFAULT_LOCALE, LOCALE_COOKIE, LOCALES, isLocale, type Locale } from "./config";

export type Dict = typeof en;
export type TKey = { [K in keyof Dict]: Dict[K] extends string ? K : never }[keyof Dict];

const dicts: Record<Locale, Dict> = { ar, en };

export async function getLocale(): Promise<Locale> {
  const c = (await cookies()).get(LOCALE_COOKIE)?.value;
  return isLocale(c) ? c : DEFAULT_LOCALE;
}

export function makeT(locale: Locale) {
  const dict = dicts[locale];
  return (key: TKey, vars?: Record<string, string | number>) => {
    let s: string = (dict[key] as string) ?? (en[key] as string) ?? key;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
    return s;
  };
}
export type T = ReturnType<typeof makeT>;

export async function getI18n() {
  const locale = await getLocale();
  const meta = LOCALES[locale];
  const t = makeT(locale);
  const fmtDate = (d: Date | null | undefined, opts: Intl.DateTimeFormatOptions = { dateStyle: "medium" }) =>
    d ? new Intl.DateTimeFormat(meta.intl, { calendar: "gregory", ...opts }).format(d) : "";
  const fmtDateTime = (d: Date | null | undefined) =>
    fmtDate(d, { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Riyadh" });
  return { locale, dir: meta.dir, t, fmtDate, fmtDateTime, dict: dicts[locale] };
}

/** Pick a subset of keys to hand to a client component. */
export function pick<K extends TKey>(t: T, keys: readonly K[]) {
  return Object.fromEntries(keys.map((k) => [k, t(k)])) as Record<K, string>;
}
