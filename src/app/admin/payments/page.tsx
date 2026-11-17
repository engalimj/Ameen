import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { addLineAction, generateBillsAction, markPaidAction, remindNowAction, runRemindersAction } from "@/app/actions/admin";
import { formatSAR } from "@/lib/money";
import { billTotal, gatewayName, payLink, periodOf, splitTotals } from "@/lib/payments";
import { currentStage } from "@/lib/reminders";
import { PageHeader, Stat } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Chip } from "@/components/StatusChip";

export default async function AdminPayments({ searchParams }: { searchParams: Promise<{ month?: string; generated?: string; reminded?: string }> }) {
  const { t, fmtDate, fmtDateTime, locale } = await getI18n();
  const sp = await searchParams;
  const period = sp.month && /^\d{4}-\d{2}$/.test(sp.month) ? sp.month : periodOf(new Date());
  const [y, m] = period.split("-").map(Number);
  const prev = periodOf(new Date(y, m - 2, 1));
  const next = periodOf(new Date(y, m, 1));
  const bills = await db.bill.findMany({
    where: { period },
    include: { lines: true, reminders: { orderBy: { createdAt: "desc" } }, unit: { include: { site: true, tenants: true } } },
    orderBy: [{ unit: { site: { name: "asc" } } }, { unit: { label: "asc" } }],
  });
  const now = new Date();
  const sum = (f: (b: (typeof bills)[number]) => number) => bills.reduce((s, b) => s + f(b), 0);
  const paid = bills.filter((b) => b.status === "PAID");
  const totals = {
    all: sum((b) => billTotal(b.lines)),
    paid: paid.reduce((s, b) => s + billTotal(b.lines), 0),
    owner: sum((b) => splitTotals(b.lines).owner),
    ameen: sum((b) => splitTotals(b.lines).ameen),
  };

  return (
    <>
      <PageHeader
        title={t("nav.payments")}
        sub={t("adminPay.sub")}
        action={
          <div className="flex flex-wrap gap-2">
            <form action={generateBillsAction}>
              <input type="hidden" name="period" value={period} />
              <SubmitButton className="btn-secondary btn">{t("adminPay.generate", { period })}</SubmitButton>
            </form>
            <form action={runRemindersAction}>
              <input type="hidden" name="period" value={period} />
              <SubmitButton className="btn-primary btn">{t("adminPay.runReminders")}</SubmitButton>
            </form>
          </div>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <Link href={`/admin/payments?month=${prev}`} className="btn-secondary btn min-h-9" aria-label={t("report.prev")}>‹</Link>
        <span className="font-semibold" dir="ltr">{period}</span>
        <Link href={`/admin/payments?month=${next}`} className="btn-secondary btn min-h-9" aria-label={t("report.next")}>›</Link>
        <span className="ms-auto text-xs text-muted">{t("adminPay.gateway")}: {gatewayName()}</span>
      </div>
      {sp.generated && <p role="status" className="mb-4 rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("adminPay.generated", { count: sp.generated })}</p>}
      {sp.reminded && <p role="status" className="mb-4 rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("adminPay.reminded", { count: sp.reminded })}</p>}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("clientPay.collected")} value={`${formatSAR(totals.paid, locale)}`} tone="good" />
        <Stat label={t("clientPay.outstanding")} value={formatSAR(totals.all - totals.paid, locale)} tone={totals.all - totals.paid ? "warn" : "good"} />
        <Stat label={t("adminPay.ownerTotal")} value={formatSAR(totals.owner, locale)} />
        <Stat label={t("adminPay.ameenTotal")} value={formatSAR(totals.ameen, locale)} />
      </div>
      <ul className="mt-6 flex flex-col gap-3">
        {bills.map((b) => {
          const state = b.status === "PAID" ? "PAID" : b.dueDate < now ? "LATE" : "DUE";
          const split = splitTotals(b.lines);
          const stage = b.status === "DUE" ? currentStage(b.dueDate, now) : null;
          return (
            <li key={b.id} className="card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{b.unit.site.name} · {b.unit.label}</p>
                  <p className="text-sm text-muted">
                    {b.unit.tenants.map((x) => x.name).join(", ") || t("adminPay.noTenant")} · {t("pay.due")} {fmtDate(b.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Chip kind={state} label={t(`bill.${state}`)} />
                  <span className="text-lg font-bold">{formatSAR(billTotal(b.lines), locale)}</span>
                </div>
              </div>
              <div className="mt-3 grid gap-3 text-sm md:grid-cols-[1fr_1fr]">
                <ul className="flex flex-col gap-1">
                  {b.lines.map((l) => (
                    <li key={l.id} className="flex justify-between">
                      <span>
                        {t(`line.${l.kind}` as never)}
                        <span className="text-muted"> · {t(`payee.${l.payee}` as never)}</span>
                        {l.note ? <span className="text-muted"> · {l.note}</span> : null}
                      </span>
                      <span>{formatSAR(l.amount, locale)}</span>
                    </li>
                  ))}
                  <li className="mt-1 flex justify-between border-t border-sand pt-1 text-muted">
                    <span>{t("adminPay.split")}</span>
                    <span>{t("payee.OWNER")} {formatSAR(split.owner, locale)} · {t("payee.AMEEN")} {formatSAR(split.ameen, locale)}</span>
                  </li>
                </ul>
                <div className="text-muted">
                  {b.status === "PAID" ? (
                    <p>{t("adminPay.paidVia", { date: fmtDateTime(b.paidAt), method: b.paidMethod ?? b.gateway ?? "" })}</p>
                  ) : (
                    <p>{t("adminPay.stage")}: {stage ? t(`stage.${stage.startsWith("WEEKLY") ? "WEEKLY" : stage}` as never) : t("stage.NONE")}</p>
                  )}
                  {b.reminders.slice(0, 3).map((r) => (
                    <p key={r.id} className="text-xs">
                      {fmtDateTime(r.createdAt)} · WhatsApp · {r.status}
                    </p>
                  ))}
                  <p className="mt-1 truncate text-xs" dir="ltr">{payLink(b.payToken)}</p>
                </div>
              </div>
              {b.status === "DUE" && (
                <div className="mt-3 flex flex-wrap gap-2 border-t border-ivory pt-3">
                  <form action={remindNowAction}>
                    <input type="hidden" name="billId" value={b.id} />
                    <SubmitButton className="btn-secondary btn min-h-9 text-sm">{t("adminPay.remindNow")}</SubmitButton>
                  </form>
                  <form action={markPaidAction} className="flex gap-2">
                    <input type="hidden" name="billId" value={b.id} />
                    <select name="method" className="input min-h-9 w-auto text-sm" aria-label={t("adminPay.method")}>
                      {["TRANSFER", "CASH", "MADA"].map((x) => <option key={x} value={x}>{t(`method.${x}` as never)}</option>)}
                    </select>
                    <SubmitButton className="btn-secondary btn min-h-9 text-sm">{t("adminPay.markPaid")}</SubmitButton>
                  </form>
                  <details className="w-full">
                    <summary className="cursor-pointer text-sm text-sage-deep">{t("adminPay.addLine")}</summary>
                    <form action={addLineAction} className="mt-2 flex flex-wrap gap-2">
                      <input type="hidden" name="billId" value={b.id} />
                      <select name="kind" className="input min-h-9 w-auto text-sm" defaultValue="REPAIR">
                        {["REPAIR", "AMEEN_FEE", "SERVICE_CHARGE", "RENT"].map((x) => <option key={x} value={x}>{t(`line.${x}` as never)}</option>)}
                      </select>
                      <input name="amount" inputMode="decimal" required placeholder={t("adminPay.amountSar")} className="input min-h-9 w-32 text-sm" />
                      <input name="note" placeholder={t("adminPay.note")} className="input min-h-9 w-48 text-sm" />
                      <SubmitButton className="btn-secondary btn min-h-9 text-sm">{t("common.add")}</SubmitButton>
                    </form>
                  </details>
                </div>
              )}
            </li>
          );
        })}
        {!bills.length && <li className="card text-center text-muted">{t("adminPay.none")}</li>}
      </ul>
    </>
  );
}
