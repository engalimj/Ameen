import type { Dict } from "@/i18n";

/** The monthly subscription and what it includes. Price up front filters out leads it doesn't fit. */
export function PlanCard({ L }: { L: Dict["landing"] }) {
  return (
    <section aria-labelledby="plan-title" className="mt-6 rounded-[20px] border border-line/70 bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 id="plan-title" className="font-semibold">{L.planTitle}</h2>
        <p className="text-muted">
          {L.planFrom} <span className="text-2xl font-bold text-sage-deep">{L.planPrice}</span> {L.planPer}
        </p>
      </div>
      <ul className="mt-3 grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {L.planIncl.map((x) => (
          <li key={x} className="flex items-start gap-2 text-[15px]">
            <svg className="mt-1 shrink-0 text-sage-deep" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            {x}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-muted">{L.planNote}</p>
    </section>
  );
}
