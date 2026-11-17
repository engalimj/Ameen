import { setLocale } from "@/app/actions/session";
import { LOCALES, type Locale } from "@/i18n/config";

/** Shows a button for each other language. With two languages it is a single toggle. */
export function LangSwitch({ current, className = "" }: { current: Locale; className?: string }) {
  const others = (Object.keys(LOCALES) as Locale[]).filter((l) => l !== current);
  return (
    <form action={setLocale} className={`flex gap-1 ${className}`}>
      {others.map((l) => (
        <button key={l} name="locale" value={l} lang={l} className="btn-quiet btn min-h-9 px-3 text-sm">
          {LOCALES[l].label}
        </button>
      ))}
    </form>
  );
}
