import type { Dict } from "@/i18n";

type Status = "done" | "wait" | "urgent";

const CHIP: Record<Status, { cls: string; icon: string }> = {
  done: { cls: "bg-done-bg text-done-ink", icon: "M5 12.5l4.5 4.5L19 7.5" },
  wait: { cls: "bg-wait-bg text-wait-ink", icon: "M12 7v5l3 2M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z" },
  urgent: { cls: "bg-urgent-bg text-urgent-ink", icon: "M12 8v5M12 16.5v.5M10.3 3.9 2.6 17.5A2 2 0 0 0 4.3 20.5h15.4a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" },
};

/* Simple line drawings standing in for the finding photos (pump room, elevator, lobby). */
const THUMBS = [
  { bg: "bg-[#F6E4DF]", ink: "text-urgent-ink", d: "M4 18h16M6 18V10h8v8M14 13h4v5M9 10V7h2v3M8 21c0-1 1-2 1-2s1 1 1 2a1 1 0 0 1-2 0z" },
  { bg: "bg-[#F3ECDF]", ink: "text-wait-ink", d: "M6 3h12v18H6zM12 3v18M9 9l-1.2 1.5h2.4zM15 15l-1.2-1.5h2.4z" },
  { bg: "bg-sage-tint", ink: "text-sage-deep", d: "M3 21h18M5 21V8l7-5 7 5v13M10 21v-6h4v6M8 11h2M14 11h2" },
];

/**
 * Hero image: the thing the visitor gets (playbook point 3). An HTML mockup of the free
 * inspection report, so it is crisp on phones, needs no image download and is translated.
 */
export function HeroReport({ L }: { L: Dict["landing"] }) {
  const score = 78;
  return (
    <figure role="img" aria-label={L.heroAlt} className="m-0">
      <div className="card relative overflow-hidden border border-line/60 shadow-[0_8px_40px_rgba(47,59,64,0.08)]" aria-hidden="true">
        <div className="flex items-start gap-3">
          <img src="/brand/ameen-app-icon.svg" alt="" width={40} height={40} className="rounded-xl" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold">{L.rpTitle}</p>
              <span className="rounded-full bg-mist-tint px-2 py-0.5 text-xs font-medium text-info-ink">{L.rpSample}</span>
            </div>
            <p className="truncate text-sm text-muted">{L.rpSite}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-4 rounded-2xl bg-ivory p-3.5">
          <div className="relative size-16 shrink-0">
            <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#E8DFD0" strokeWidth="4" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#4E7A6E" strokeWidth="4" strokeLinecap="round" strokeDasharray={`${(score / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" dir="ltr">{score}</span>
          </div>
          <div>
            <p className="text-sm text-muted">{L.rpScore}</p>
            <p className="text-sm font-medium">{L.rpSent}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold">{L.rpFindings}</p>
        <ul className="mt-2 divide-y divide-line/60">
          {L.rpItems.map(([label, status, kind]) => {
            const c = CHIP[kind as Status];
            return (
              <li key={label} className="flex items-center justify-between gap-3 py-2">
                <span className="text-[15px]">{label}</span>
                <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${c.cls}`}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={c.icon} /></svg>
                  {status}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 grid grid-cols-3 gap-2">
          {THUMBS.map((th, i) => (
            <div key={i} className={`flex aspect-[4/3] flex-col items-center justify-center gap-1 rounded-xl ${th.bg} ${th.ink}`}>
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={th.d} /></svg>
              <span className="text-[11px] font-medium">{L.rpPhotoLabels[i]}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3 text-sm">
          <span className="text-muted">{L.rpPhotos}</span>
          <span className="font-medium text-sage-deep">{L.rpPlan}</span>
        </div>
      </div>
      <figcaption className="mt-2 text-xs text-muted">{L.rpNote}</figcaption>
    </figure>
  );
}
