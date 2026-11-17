import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { periodOf } from "@/lib/payments";
import { clientMonthStats } from "@/lib/report";
import { PageHeader, Stat } from "@/components/PortalShell";
import { PrintButton } from "@/components/PrintButton";

function shift(period: string, by: number) {
  const [y, m] = period.split("-").map(Number);
  return periodOf(new Date(y, m - 1 + by, 1));
}

export default async function ClientReport({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const user = await requireRole("CLIENT");
  const { t, fmtDate, locale } = await getI18n();
  const { month } = await searchParams;
  const period = month && /^\d{4}-\d{2}$/.test(month) ? month : periodOf(new Date());
  const clientId = user.clientId ?? "-";
  const [client, s] = await Promise.all([db.client.findUnique({ where: { id: clientId } }), clientMonthStats(clientId, period)]);
  const [y, m] = period.split("-").map(Number);
  const monthLabel = fmtDate(new Date(y, m - 1, 1), { month: "long", year: "numeric" });
  const num = (n: number | null, digits = 0, suffix = "") => (n === null ? "—" : `${n.toLocaleString(locale === "ar" ? "ar-SA-u-nu-latn" : "en", { maximumFractionDigits: digits })}${suffix}`);

  return (
    <>
      <div className="no-print mb-4 flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Link href={`/client/report?month=${shift(period, -1)}`} className="btn-secondary btn">{t("report.prev")}</Link>
          <Link href={`/client/report?month=${shift(period, 1)}`} className="btn-secondary btn">{t("report.next")}</Link>
        </div>
        <PrintButton label={t("report.print")} />
      </div>
      <div className="mb-4 flex items-center gap-3">
        <img src="/brand/ameen-mark-primary.svg" alt="" width={40} height={40} />
        <div>
          <p className="text-sm text-muted">{client?.name}</p>
        </div>
      </div>
      <PageHeader title={t("report.title", { month: monthLabel })} sub={t("report.sub")} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("report.completed")} value={`${s.completed} / ${s.total}`} tone="good" />
        <Stat label={t("report.requests")} value={s.requests} />
        <Stat label={t("report.avgResponse")} value={num(s.avgResponseH, 1, ` ${t("report.hours")}`)} />
        <Stat label={t("report.onTime")} value={num(s.onTimePct, 0, "%")} tone={s.onTimePct !== null && s.onTimePct < 90 ? "warn" : "good"} />
        <Stat label={t("report.inspectionScore")} value={num(s.inspectionScore, 0, "%")} />
        <Stat label={t("report.rating")} value={num(s.avgRating, 1, " / 5")} />
        <Stat label={t("client.overdue")} value={s.overdueNow} tone={s.overdueNow ? "warn" : "good"} />
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="card">
          <h2 className="h2 mb-2">{t("report.bySite")}</h2>
          <table className="table">
            <thead><tr><th>{t("report.site")}</th><th>{t("report.done")}</th><th>{t("report.total")}</th></tr></thead>
            <tbody>
              {s.bySite.map((r) => (
                <tr key={r.name}><td>{r.name}</td><td>{r.done}</td><td>{r.total}</td></tr>
              ))}
              {!s.bySite.length && <tr><td colSpan={3} className="text-muted">{t("common.noResults")}</td></tr>}
            </tbody>
          </table>
        </section>
        <section className="card">
          <h2 className="h2 mb-2">{t("report.byType")}</h2>
          <table className="table">
            <thead><tr><th>{t("job.type")}</th><th>{t("report.done")}</th></tr></thead>
            <tbody>
              {s.byType.map(([type, n]) => (
                <tr key={type}><td>{t(`type.${type}` as never)}</td><td>{n}</td></tr>
              ))}
              {!s.byType.length && <tr><td colSpan={2} className="text-muted">{t("common.noResults")}</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
