"use client";
import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";

type S = Record<
  "phone" | "phoneHint" | "send" | "code" | "codeHint" | "verify" | "change" | "resend" | "devCode" |
  "err.badPhone" | "err.unknown" | "err.rate" | "err.badCode",
  string
>;

export function LoginForm({ s }: { s: S }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { step: "phone" });
  const err = state.error ? s[`err.${state.error}` as keyof S] : null;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {state.step === "phone" ? (
        <div>
          <label htmlFor="phone" className="label">{s.phone}</label>
          <div className="flex gap-2" dir="ltr">
            <span className="input flex w-auto items-center text-muted">+966</span>
            <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="5X XXX XXXX" className="input" required autoFocus aria-describedby="phone-hint" />
          </div>
          <p id="phone-hint" className="hint">{s.phoneHint}</p>
        </div>
      ) : (
        <div>
          <label htmlFor="code" className="label">{s.code}</label>
          <input id="code" name="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} dir="ltr" className="input text-center text-2xl tracking-[0.5em]" required autoFocus aria-describedby="code-hint" />
          <p id="code-hint" className="hint">
            {s.codeHint} <span dir="ltr">{state.phone}</span>
          </p>
          {state.devCode && (
            <p className="mt-2 rounded-xl bg-wait-bg px-3 py-2 text-sm text-wait-ink">
              {s.devCode} <strong dir="ltr">{state.devCode}</strong>
            </p>
          )}
        </div>
      )}
      {err && <p role="alert" className="rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent-ink">{err}</p>}
      <button className="btn-primary btn w-full" disabled={pending}>
        {state.step === "phone" ? s.send : s.verify}
      </button>
      {state.step === "code" && (
        <div className="flex justify-between text-sm">
          <button name="intent" value="restart" className="text-sage-deep" formNoValidate>{s.change}</button>
          <button name="intent" value="resend" className="text-sage-deep" formNoValidate>{s.resend}</button>
        </div>
      )}
    </form>
  );
}
