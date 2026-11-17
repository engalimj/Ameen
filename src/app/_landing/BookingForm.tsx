"use client";
import { useState, useTransition } from "react";
import { createLead } from "@/app/actions/lead";

export type BookingStrings = {
  bookTitle: string; bookSub: string; progressLabel: string; p: string[];
  q1: string; types: string[]; q1b: string; sizes: string[];
  q2: string; needsL: string[]; q2hint: string;
  q3: string; fName: string; fNamePh: string; fPhone: string; fPhoneHint: string; fCity: string; fCityPh: string;
  back: string; next: string; send: string; err1: string; err2: string; err3: string; errPhone: string; privacy: string;
  thanks: string; thanksSub: string; again: string;
};

const TYPE_KEYS = ["COMPOUND", "BUILDING", "VILLAS"] as const;
const SIZE_KEYS = ["LT20", "20_50", "50_150", "GT150"] as const;
const NEED_KEYS = ["CLEANING", "INSPECTION", "MAINTENANCE", "REPAIR", "COLLECTION"] as const;

const chip = (on: boolean) =>
  `min-h-13 rounded-2xl px-4 text-start text-base transition-colors ${on ? "border-2 border-sage-deep bg-sage-tint font-semibold" : "border border-line bg-white hover:bg-ivory"}`;

export function BookingForm({ s }: { s: BookingStrings }) {
  const [step, setStep] = useState(1);
  const [type, setType] = useState<number | null>(null);
  const [size, setSize] = useState<number | null>(null);
  const [needs, setNeeds] = useState<boolean[]>([false, false, false, false, false]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  const next = () => {
    if (step === 1 && (type === null || size === null)) return setError(s.err1);
    if (step === 2 && !needs.some(Boolean)) return setError(s.err2);
    if (step === 3) {
      if (name.trim().length < 2 || phone.trim().length < 9) return setError(s.err3);
      return start(async () => {
        const res = await createLead({
          name, phone, city: city || undefined,
          siteType: TYPE_KEYS[type!], units: SIZE_KEYS[size!],
          services: NEED_KEYS.filter((_, i) => needs[i]),
        });
        if (res.ok) { setSent(true); setError(null); } else setError(res.error === "phone" ? s.errPhone : s.err3);
      });
    }
    setError(null);
    setStep(step + 1);
  };

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center" role="status">
        <span className="flex size-16 items-center justify-center rounded-full bg-done-bg text-3xl text-done-ink">✓</span>
        <h3 className="text-xl font-bold">{s.thanks}</h3>
        <p className="text-muted">{s.thanksSub}</p>
        <button className="btn-quiet btn" onClick={() => { setSent(false); setStep(1); setType(null); setSize(null); setNeeds([false, false, false, false, false]); setName(""); setPhone(""); setCity(""); }}>
          {s.again}
        </button>
      </div>
    );
  }

  return (
    <div>
      <ol className="mb-6 grid grid-cols-3 gap-2" aria-label={s.progressLabel}>
        {s.p.map((label, i) => (
          <li key={label} aria-current={i + 1 === step ? "step" : undefined}>
            <div className={`h-1.5 rounded-full ${i < step ? "bg-sage-deep" : "bg-sand"}`} />
            <p className={`mt-1.5 text-[13px] ${i + 1 === step ? "font-semibold" : "text-muted"}`}>{label}</p>
          </li>
        ))}
      </ol>

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 font-semibold">{s.q1}</legend>
            <div className="grid gap-2 sm:grid-cols-3">
              {s.types.map((l, i) => (
                <button key={l} type="button" aria-pressed={type === i} className={chip(type === i)} onClick={() => { setType(i); setError(null); }}>{l}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 font-semibold">{s.q1b}</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {s.sizes.map((l, i) => (
                <button key={l} type="button" aria-pressed={size === i} className={chip(size === i)} onClick={() => { setSize(i); setError(null); }}>{l}</button>
              ))}
            </div>
          </fieldset>
        </div>
      )}

      {step === 2 && (
        <fieldset>
          <legend className="mb-1 font-semibold">{s.q2}</legend>
          <p className="mb-3 text-sm text-muted">{s.q2hint}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {s.needsL.map((l, i) => (
              <button key={l} type="button" aria-pressed={needs[i]} className={`${chip(needs[i])} flex items-center justify-between`} onClick={() => { setNeeds(needs.map((v, j) => (j === i ? !v : v))); setError(null); }}>
                {l}
                <span aria-hidden="true" className="text-sage-deep">{needs[i] ? "✓" : ""}</span>
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="flex flex-col gap-4">
          <legend className="mb-2 font-semibold">{s.q3}</legend>
          <div>
            <label htmlFor="lead-name" className="label">{s.fName}</label>
            <input id="lead-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={s.fNamePh} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="lead-phone" className="label">{s.fPhone}</label>
            <input id="lead-phone" className="input" dir="ltr" type="tel" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05X XXX XXXX" autoComplete="tel" aria-describedby="lead-phone-hint" />
            <p id="lead-phone-hint" className="hint">{s.fPhoneHint}</p>
          </div>
          <div>
            <label htmlFor="lead-city" className="label">{s.fCity}</label>
            <input id="lead-city" className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder={s.fCityPh} />
          </div>
          <p className="text-[13px] text-muted">{s.privacy}</p>
        </fieldset>
      )}

      {error && <p role="alert" className="mt-4 rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent-ink">{error}</p>}
      <div className="mt-6 flex gap-2">
        {step > 1 && <button type="button" className="btn-secondary btn" onClick={() => { setStep(step - 1); setError(null); }}>{s.back}</button>}
        <button type="button" className="btn-primary btn flex-1" onClick={next} disabled={pending}>{step === 3 ? s.send : s.next}</button>
      </div>
    </div>
  );
}
