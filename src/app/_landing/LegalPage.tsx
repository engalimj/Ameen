import Link from "next/link";
import { getI18n } from "@/i18n";
import { LangSwitch } from "@/components/LangSwitch";
import { LegalFooter } from "./LegalFooter";

/** Privacy policy and terms pages, linked from the landing page form and footer. */
export async function LegalPage({ doc }: { doc: "privacy" | "terms" }) {
  const { dict, locale, t } = await getI18n();
  const legal = dict.legal;
  const page = legal[doc];
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2" aria-label={legal.home}>
          <img src="/brand/ameen-mark-primary.svg" alt="" width={32} height={32} />
          <span className="text-xl font-bold">{t("brand.name")}</span>
        </Link>
        <LangSwitch current={locale} />
      </header>
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 pb-12 pt-6">
        <h1 className="text-3xl font-bold">{page.title}</h1>
        <p className="mt-1 text-sm text-muted">{legal.updated}</p>
        <p className="mt-6 text-lg">{page.intro}</p>
        {page.sections.map(([h, body]) => (
          <section key={h} className="mt-6">
            <h2 className="text-lg font-semibold">{h}</h2>
            <p className="mt-1.5 text-muted">{body}</p>
          </section>
        ))}
        <Link href="/" className="btn-secondary btn mt-10">{legal.home}</Link>
      </main>
      <LegalFooter L={dict.landing} legal={legal} />
    </div>
  );
}
