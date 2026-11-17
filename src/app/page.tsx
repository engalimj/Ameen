import Link from "next/link";
import { getI18n } from "@/i18n";
import { LangSwitch } from "@/components/LangSwitch";
import { BookingForm } from "./_landing/BookingForm";

const SERVICE_ICONS = [
  { d: "M9 3v10M5 13h8l1.5 8h-11zM17 7l1.5-2 1.5 2-1.5 2z", bg: "bg-sage-tint", ink: "text-sage-deep" },
  { d: "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM9 10l2 2 4-4M9 16h6", bg: "bg-mist-tint", ink: "text-info-ink" },
  { d: "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2", bg: "bg-[#F3ECDF]", ink: "text-wait-ink" },
  { d: "M15 4a5 5 0 0 0-6 6l-6 6 3 3 6-6a5 5 0 0 0 6-6l-3 3-2.5-.5L12 7z", bg: "bg-[#F6E4DF]", ink: "text-urgent-ink" },
];

export default async function Landing() {
  const { dict, locale, t } = await getI18n();
  const L = dict.landing;

  return (
    <div>
      <header className="sticky top-0 z-30 border-b border-sand/70 bg-ivory/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2" aria-label={t("brand.name")}>
            <img src="/brand/ameen-mark-primary.svg" alt="" width={36} height={36} />
            <span className="text-xl font-bold">{t("brand.name")}</span>
          </Link>
          <nav className="ms-6 hidden gap-6 text-[15px] md:flex" aria-label={L.navLabel}>
            <a href="#services" className="hover:text-sage-deep">{L.navServices}</a>
            <a href="#how" className="hover:text-sage-deep">{L.navHow}</a>
            <a href="#faq" className="hover:text-sage-deep">{L.navFaq}</a>
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <LangSwitch current={locale} />
            <Link href="/login" className="btn-quiet btn min-h-9 px-3 text-sm">{L.signIn}</Link>
            <a href="#book" className="btn-primary btn hidden min-h-10 sm:inline-flex">{L.ctaShort}</a>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-[1.1fr_1fr] md:py-20">
          <div>
            <span className="inline-block rounded-full bg-sage-tint px-3 py-1 text-sm font-medium text-sage-deep">{L.badge}</span>
            <h1 className="mt-4 text-4xl font-bold leading-tight md:text-5xl">{L.heroTitle}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{L.heroSub}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#book" className="btn-primary btn min-h-12 px-6 text-base">{L.ctaMain}</a>
              <a href="#how" className="btn-secondary btn min-h-12 px-6 text-base">{L.ctaSecond}</a>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted">
              {[L.trust1, L.trust2, L.trust3].map((x) => (
                <li key={x} className="flex items-center gap-1.5"><span className="text-sage-deep" aria-hidden="true">✓</span>{x}</li>
              ))}
            </ul>
          </div>
          <div className="relative md:mb-16" aria-hidden="true">
            <div className="card shadow-[0_8px_40px_rgba(47,59,64,0.08)]">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{L.cardTitle}</p>
                <span className="rounded-full bg-done-bg px-3 py-1 text-[13px] font-medium text-done-ink">✓ {L.cardDone}</span>
              </div>
              <p className="mt-1 text-sm text-muted">{L.cardPlace}</p>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="flex aspect-[4/3] items-end rounded-2xl bg-sand p-3"><span className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{L.before}</span></div>
                <div className="flex aspect-[4/3] items-end rounded-2xl bg-[#DCEBE6] p-3"><span className="rounded-full bg-sage-deep px-3 py-1 text-xs font-semibold text-white">{L.after}</span></div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted">{L.cardTime}</span>
                <span className="btn-primary btn min-h-9 px-4 text-sm">{L.approve}</span>
              </div>
            </div>
            <div className="card absolute -bottom-24 end-6 w-56 shadow-[0_8px_40px_rgba(47,59,64,0.10)] max-sm:hidden">
              <p className="text-sm font-semibold">{L.reportTitle}</p>
              <p className="mt-1 text-3xl font-bold text-sage-deep" dir="ltr">96%</p>
              <p className="text-xs text-muted">{L.reportSub}</p>
            </div>
          </div>
        </section>

        <section id="services" className="bg-white py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">{L.servicesTitle}</h2>
            <p className="mt-2 text-muted">{L.servicesSub}</p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {L.s.map(([title, body], i) => (
                <div key={title} className="rounded-[20px] bg-ivory p-6">
                  <span className={`flex size-13 items-center justify-center rounded-2xl ${SERVICE_ICONS[i].bg} ${SERVICE_ICONS[i].ink}`}>
                    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={SERVICE_ICONS[i].d} /></svg>
                  </span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">{L.howTitle}</h2>
            <p className="mt-2 text-muted">{L.howSub}</p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {L.st.map(([title, body], i) => (
                <li key={title} className="card">
                  <span className="flex size-10 items-center justify-center rounded-full bg-sage-deep font-bold text-white">{i + 1}</span>
                  <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                  <p className="mt-1.5 text-[15px] text-muted">{body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-sand/60 py-16">
          <div className="mx-auto max-w-6xl px-4">
            <h2 className="text-3xl font-bold">{L.whyTitle}</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {L.w.map(([big, title, body]) => (
                <div key={title} className="card">
                  <p className="text-2xl font-bold text-sage-deep">{big}</p>
                  <h3 className="mt-2 font-semibold">{title}</h3>
                  <p className="mt-1 text-[15px] text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="book" className="py-16">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 md:grid-cols-[1fr_1.3fr]">
            <div>
              <h2 className="text-3xl font-bold">{L.bookTitle}</h2>
              <p className="mt-2 text-muted">{L.bookSub}</p>
            </div>
            <div className="card p-6 shadow-[0_8px_40px_rgba(47,59,64,0.06)] md:p-8">
              <BookingForm s={L} />
            </div>
          </div>
        </section>

        <section id="faq" className="bg-white py-16">
          <div className="mx-auto max-w-3xl px-4">
            <h2 className="text-3xl font-bold">{L.faqTitle}</h2>
            <div className="mt-6 flex flex-col gap-2">
              {L.fq.map(([q, a]) => (
                <details key={q} className="group rounded-2xl bg-ivory px-5 py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                    {q}
                    <span className="text-xl text-sage-deep group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
                  </summary>
                  <p className="mt-2 text-muted">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="mx-auto max-w-4xl rounded-[28px] bg-sage-deep px-6 py-12 text-center text-white">
            <h2 className="text-3xl font-bold">{L.finalTitle}</h2>
            <p className="mt-2 text-white/85">{L.finalSub}</p>
            <a href="#book" className="btn mt-6 min-h-12 bg-white px-6 text-base text-sage-deep hover:bg-ivory">{L.ctaMain}</a>
          </div>
        </section>
      </main>

      <footer className="border-t border-sand py-8">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 text-sm text-muted">
          <div className="flex items-center gap-2">
            <img src="/brand/ameen-mark-primary.svg" alt="" width={28} height={28} />
            <span>{L.footerTag}</span>
          </div>
          <div className="flex gap-4" dir="ltr">
            <a href="https://instagram.com/tryameen.sa" target="_blank" rel="noreferrer" className="hover:text-sage-deep">Instagram @tryameen.sa</a>
            <a href="https://www.tiktok.com/@tryameen.sa" target="_blank" rel="noreferrer" className="hover:text-sage-deep">TikTok</a>
          </div>
          <span>{L.copyright}</span>
        </div>
      </footer>
    </div>
  );
}
