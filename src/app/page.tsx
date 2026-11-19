import { getI18n } from "@/i18n";
import { LangSwitch } from "@/components/LangSwitch";
import { BookingForm } from "./_landing/BookingForm";
import { HeroReport } from "./_landing/HeroReport";
import { LegalFooter } from "./_landing/LegalFooter";
import { PlanCard } from "./_landing/PlanCard";

/*
 * Landing page. Built to docs/landing-page-playbook.pdf (see CLAUDE.md, "Landing page rules").
 * Order, top to bottom: headline (qualifying question + promise), subheadline, price and what it
 * includes (qualifies leads), hero image, CTA, form (+ justification line),
 * 3 objection bullets below the fold, social proof only when we have real proof, legal links.
 * No navigation menu and no second action: every element must raise qualified opt-ins.
 */
export default async function Landing() {
  const { dict, locale, t } = await getI18n();
  const L = dict.landing;
  const proof = L.proof as string[][];

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2">
          <img src="/brand/ameen-mark-primary.svg" alt="" width={32} height={32} />
          <span className="text-xl font-bold">{t("brand.name")}</span>
        </span>
        <LangSwitch current={locale} />
      </header>

      <main className="flex-1">
        <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-12 pt-4 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pt-10">
          <div>
            <h1 className="text-balance">
              <span className="block text-xl font-semibold leading-snug text-sage-deep md:text-2xl">{L.headlineQ}</span>
              <span className="mt-2 block text-[2rem] font-bold leading-tight md:text-5xl md:leading-[1.15]">{L.headline}</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{L.sub}</p>
            <PlanCard L={L} />
            <div className="mt-6 md:hidden">
              <a href="#book" className="btn-primary btn min-h-13 w-full text-base">{L.cta}</a>
              <p className="mt-2 text-center text-sm text-muted">{L.ctaHow}</p>
            </div>
            <div className="mt-8">
              <HeroReport L={L} />
            </div>
          </div>

          <div id="book" className="scroll-mt-4 md:sticky md:top-6 md:self-start">
            <div className="card p-5 shadow-[0_8px_40px_rgba(47,59,64,0.08)] md:p-7">
              <h2 className="text-2xl font-bold">{L.formTitle}</h2>
              <p className="mt-1 text-muted">{L.ctaHow}</p>
              <p className="mt-4 rounded-xl bg-sage-tint px-3.5 py-2.5 text-sm text-sage-deeper">{L.justify}</p>
              <div className="mt-5">
                <BookingForm s={L} />
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="obj-title" className="bg-white py-12">
          <div className="mx-auto max-w-3xl px-4">
            <h2 id="obj-title" className="text-2xl font-bold">{L.objTitle}</h2>
            <ul className="mt-6 flex flex-col gap-5">
              {L.obj.map(([q, a]) => (
                <li key={q} className="flex gap-3">
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-done-bg text-done-ink" aria-hidden="true">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
                  </span>
                  <div>
                    <h3 className="font-semibold">{q}</h3>
                    <p className="mt-1 text-muted">{a}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {proof.length > 0 && (
          <section aria-labelledby="proof-title" className="py-12">
            <div className="mx-auto max-w-3xl px-4">
              <h2 id="proof-title" className="text-2xl font-bold">{L.proofTitle}</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {proof.map(([quote, who]) => (
                  <figure key={who} className="card">
                    <blockquote className="text-lg">“{quote}”</blockquote>
                    <figcaption className="mt-3 text-sm text-muted">{who}</figcaption>
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <LegalFooter L={L} legal={dict.legal} />
    </div>
  );
}
