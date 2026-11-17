import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { JobList } from "@/components/Jobs";
import { PageHeader } from "@/components/PortalShell";

export default async function WorkerHome({ searchParams }: { searchParams: Promise<{ done?: string }> }) {
  const user = await requireRole("WORKER");
  const { t, fmtDate, fmtDateTime } = await getI18n();
  const { done } = await searchParams;
  // End of today in Riyadh (UTC+3)
  const r = new Date(Date.now() + 3 * 3600_000);
  const endOfToday = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), r.getUTCDate() + 1) - 3 * 3600_000 - 1);
  const base = { assigneeId: user.id };
  const [active, upcoming, waiting] = await Promise.all([
    db.job.findMany({
      where: { ...base, status: { in: ["NEW", "SCHEDULED", "IN_PROGRESS"] }, OR: [{ scheduledFor: null }, { scheduledFor: { lte: endOfToday } }] },
      include: { site: true, unit: true },
      orderBy: [{ priority: "desc" }, { scheduledFor: "asc" }],
    }),
    db.job.findMany({
      where: { ...base, status: { in: ["NEW", "SCHEDULED"] }, scheduledFor: { gt: endOfToday } },
      include: { site: true, unit: true },
      orderBy: { scheduledFor: "asc" },
      take: 10,
    }),
    db.job.count({ where: { ...base, status: "NEEDS_APPROVAL" } }),
  ]);
  return (
    <>
      <PageHeader title={t("worker.today")} sub={t("worker.todaySub", { count: active.length, waiting })} />
      {done && <p role="status" className="mb-4 rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("worker.sentForApproval", { number: done })}</p>}
      <JobList jobs={active} hrefFor={(j) => `/worker/jobs/${j.id}`} t={t} fmt={(d) => fmtDateTime(d)} empty={t("worker.noJobs")} />
      {upcoming.length > 0 && (
        <>
          <h2 className="h2 mb-3 mt-8">{t("worker.upcoming")}</h2>
          <JobList jobs={upcoming} hrefFor={(j) => `/worker/jobs/${j.id}`} t={t} fmt={(d) => fmtDate(d)} empty="" />
        </>
      )}
    </>
  );
}
