import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { isOverdue } from "@/lib/constants";
import { periodOf } from "@/lib/payments";
import { clientMonthStats } from "@/lib/report";
import { JobList } from "@/components/Jobs";
import { PageHeader, Stat } from "@/components/PortalShell";

export default async function ClientHome() {
  const user = await requireRole("CLIENT");
  const { t, fmtDate } = await getI18n();
  const clientId = user.clientId ?? "-";
  const client = await db.client.findUnique({ where: { id: clientId }, include: { sites: { include: { _count: { select: { units: true } } } } } });
  const open = await db.job.findMany({
    where: { site: { clientId }, status: { not: "COMPLETED" } },
    include: { site: true, unit: true, assignee: true },
    orderBy: { createdAt: "desc" },
  });
  const stats = await clientMonthStats(clientId, periodOf(new Date()));
  const approval = open.filter((j) => j.status === "NEEDS_APPROVAL");
  const overdue = open.filter((j) => isOverdue(j));
  const other = open.filter((j) => j.status !== "NEEDS_APPROVAL");

  return (
    <>
      <PageHeader
        title={client?.name ?? t("nav.home")}
        sub={client ? t("client.contract", { from: fmtDate(client.contractStart), to: fmtDate(client.contractEnd) }) : undefined}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label={t("client.open")} value={open.length} />
        <Stat label={t("client.needsApproval")} value={approval.length} tone={approval.length ? "warn" : "plain"} />
        <Stat label={t("client.overdue")} value={overdue.length} tone={overdue.length ? "warn" : "good"} />
        <Stat label={t("client.doneThisMonth")} value={stats.completed} tone="good" />
      </div>
      {approval.length > 0 && (
        <section className="mt-8">
          <h2 className="h2 mb-3">{t("client.waitingForYou")}</h2>
          <JobList jobs={approval} hrefFor={(j) => `/client/jobs/${j.id}`} t={t} fmt={(d) => fmtDate(d)} empty="" />
        </section>
      )}
      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="h2">{t("client.inProgress")}</h2>
          <Link href="/client/jobs" className="text-sm font-medium text-sage-deep">{t("common.viewAll")}</Link>
        </div>
        <JobList jobs={other.slice(0, 8)} hrefFor={(j) => `/client/jobs/${j.id}`} t={t} fmt={(d) => fmtDate(d)} empty={t("client.nothingOpen")} />
      </section>
      <section className="mt-8">
        <h2 className="h2 mb-3">{t("client.sites")}</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {client?.sites.map((s) => (
            <div key={s.id} className="card">
              <p className="font-semibold">{s.name}</p>
              <p className="text-sm text-muted">{s.city} · {t("client.units", { count: s._count.units })}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
