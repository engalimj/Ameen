import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { formatSAR } from "@/lib/money";
import { billTotal } from "@/lib/payments";
import { Empty, PageHeader } from "@/components/PortalShell";
import { Chip } from "@/components/StatusChip";

export default async function TenantPayments() {
  const user = await requireRole("TENANT");
  const { t, fmtDate, locale } = await getI18n();
  const bills = user.unitId
    ? await db.bill.findMany({ where: { unitId: user.unitId, status: { not: "CANCELLED" } }, include: { lines: true }, orderBy: { dueDate: "desc" } })
    : [];
  const now = new Date();
  return (
    <>
      <PageHeader title={t("nav.payments")} sub={t("tenant.paymentsSub")} />
      {bills.length === 0 ? (
        <Empty text={t("tenant.noBills")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {bills.map((b) => {
            const state = b.status === "PAID" ? "PAID" : b.dueDate < now ? "LATE" : "DUE";
            return (
              <li key={b.id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold" dir="ltr">{b.period}</p>
                    <p className="text-sm text-muted">
                      {state === "PAID" ? t("tenant.paidOn", { date: fmtDate(b.paidAt) }) : t("tenant.dueOn", { date: fmtDate(b.dueDate) })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Chip kind={state} label={t(`bill.${state}`)} />
                    <span className="text-lg font-bold">{formatSAR(billTotal(b.lines), locale)}</span>
                  </div>
                </div>
                <ul className="mt-3 flex flex-col gap-1 text-sm">
                  {b.lines.map((l) => (
                    <li key={l.id} className="flex justify-between text-muted">
                      <span>{t(`line.${l.kind}` as never)}{l.note ? ` · ${l.note}` : ""}</span>
                      <span>{formatSAR(l.amount, locale)}</span>
                    </li>
                  ))}
                </ul>
                {state !== "PAID" && (
                  <Link href={`/pay/${b.payToken}`} className="btn-primary btn mt-4">{t("pay.payNow")}</Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
