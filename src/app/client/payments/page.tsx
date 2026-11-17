import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { formatSAR } from "@/lib/money";
import { periodOf, splitTotals } from "@/lib/payments";
import { PageHeader, Stat } from "@/components/PortalShell";
import { Chip } from "@/components/StatusChip";

export default async function ClientPayments({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireRole("CLIENT");
  const { t, fmtDate, locale } = await getI18n();
  const { month } = await searchParams;
  const period = month && /^\d{4}-\d{2}$/.test(month) ? month : periodOf(new Date());
  const bills = await db.bill.findMany({
    where: { period, status: { not: "CANCELLED" }, unit: { site: { clientId: user.clientId ?? "-" } } },
    include: { lines: true, unit: { include: { site: true, tenants: true } } },
    orderBy: [{ unit: { site: { name: "asc" } } }, { unit: { label: "asc" } }],
  });
  const now = new Date();
  const ownerAll = bills.reduce((s, b) => s + splitTotals(b.lines).owner, 0);
  const ownerPaid = bills.filter((b) => b.status === "PAID").reduce((s, b) => s + splitTotals(b.lines).owner, 0);
  const late = bills.filter((b) => b.status === "DUE" && b.dueDate < now).length;
  const periods = await db.bill.findMany({ distinct: ["period"], select: { period: true }, orderBy: { period: "desc" }, take: 12 });

  return (
    <>
      <PageHeader title={t("nav.payments")} sub={t("clientPay.sub")} />
      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {periods.map((p) => (
          <Link key={p.period} href={`/client/payments?month=${p.period}`} dir="ltr" className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${p.period === period ? "bg-sage-deep text-white" : "bg-white"}`}>
            {p.period}
          </Link>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("clientPay.expected")} value={formatSAR(ownerAll, locale)} />
        <Stat label={t("clientPay.collected")} value={formatSAR(ownerPaid, locale)} tone="good" />
        <Stat label={t("clientPay.outstanding")} value={formatSAR(ownerAll - ownerPaid, locale)} tone={ownerAll - ownerPaid ? "warn" : "good"} />
        <Stat label={t("clientPay.lateUnits")} value={late} tone={late ? "warn" : "good"} />
      </div>
      <div className="card mt-6 overflow-x-auto p-2">
        <table className="table">
          <thead>
            <tr>
              <th>{t("pay.unit")}</th><th>{t("pay.tenant")}</th><th>{t("clientPay.ownerShare")}</th><th>{t("pay.due")}</th><th>{t("pay.status")}</th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const state = b.status === "PAID" ? "PAID" : b.dueDate < now ? "LATE" : "DUE";
              return (
                <tr key={b.id}>
                  <td className="font-medium">{b.unit.site.name} · {b.unit.label}</td>
                  <td>{b.unit.tenants.map((x) => x.name).join(", ")}</td>
                  <td>{formatSAR(splitTotals(b.lines).owner, locale)}</td>
                  <td>{fmtDate(b.dueDate)}</td>
                  <td><Chip kind={state} label={t(`bill.${state}`)} /></td>
                </tr>
              );
            })}
            {!bills.length && <tr><td colSpan={5} className="text-center text-muted">{t("common.noResults")}</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}
