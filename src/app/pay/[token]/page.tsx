import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { checkoutAction } from "@/app/actions/pay";
import { formatSAR } from "@/lib/money";
import { billTotal, gatewayName } from "@/lib/payments";
import { LangSwitch } from "@/components/LangSwitch";
import { SubmitButton } from "@/components/SubmitButton";
import { Chip } from "@/components/StatusChip";

export const metadata = { title: "Pay", robots: { index: false } };

export default async function PayPage({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ paid?: string }> }) {
  const { token } = await params;
  const { paid } = await searchParams;
  const { t, fmtDate, locale } = await getI18n();
  const bill = await db.bill.findUnique({ where: { payToken: token }, include: { lines: true, unit: { include: { site: true } } } });
  if (!bill) notFound();
  const total = billTotal(bill.lines);
  const late = bill.status === "DUE" && bill.dueDate < new Date();
  const mock = gatewayName() === "mock";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/brand/ameen-mark-primary.svg" alt="" width={36} height={36} />
          <span className="text-lg font-bold">{t("brand.name")}</span>
        </div>
        <LangSwitch current={locale} />
      </div>
      <div className="card mt-8 p-6">
        <p className="text-sm text-muted">{bill.unit.site.name} · {bill.unit.label}</p>
        <h1 className="h1 mt-1">{t("pay.title", { period: bill.period })}</h1>
        <div className="mt-2">
          <Chip kind={bill.status === "PAID" ? "PAID" : late ? "LATE" : "DUE"} label={t(bill.status === "PAID" ? "bill.PAID" : late ? "bill.LATE" : "bill.DUE")} />
        </div>
        <ul className="mt-5 flex flex-col gap-2 text-[15px]">
          {bill.lines.map((l) => (
            <li key={l.id} className="flex justify-between">
              <span>{t(`line.${l.kind}` as never)}{l.note ? <span className="text-muted"> · {l.note}</span> : null}</span>
              <span>{formatSAR(l.amount, locale)}</span>
            </li>
          ))}
          <li className="mt-2 flex justify-between border-t border-sand pt-3 text-lg font-bold">
            <span>{t("pay.total")}</span>
            <span>{formatSAR(total, locale)}</span>
          </li>
        </ul>
        {bill.status === "PAID" ? (
          <p role="status" className="mt-6 rounded-xl bg-done-bg px-4 py-3 text-done-ink">
            {paid ? t("pay.thanks") : t("pay.alreadyPaid", { date: fmtDate(bill.paidAt) })}
          </p>
        ) : (
          <form action={checkoutAction} className="mt-6 flex flex-col gap-3">
            <input type="hidden" name="token" value={token} />
            <p className="text-sm text-muted">{t("pay.dueOn", { date: fmtDate(bill.dueDate) })}</p>
            <fieldset className="grid grid-cols-3 gap-2" aria-label={t("pay.method")}>
              {(["MADA", "APPLE_PAY", "STC_PAY"] as const).map((m, i) => (
                <label key={m} className="flex min-h-12 cursor-pointer items-center justify-center rounded-xl border border-line text-sm font-semibold has-[:checked]:border-2 has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint">
                  <input type="radio" name="method" value={m} defaultChecked={i === 0} className="sr-only" />
                  {t(`method.${m}`)}
                </label>
              ))}
            </fieldset>
            <SubmitButton className="btn-primary btn min-h-12 w-full text-lg">{t("pay.payAmount", { amount: formatSAR(total, locale) })}</SubmitButton>
            {mock && <p className="rounded-xl bg-wait-bg px-3 py-2 text-xs text-wait-ink">{t("pay.testMode")}</p>}
          </form>
        )}
      </div>
      <p className="mt-6 text-center text-xs text-muted">{t("pay.secure")}</p>
    </main>
  );
}
