import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { JOB_STATUSES } from "@/lib/constants";
import { StatusFilter } from "@/components/StatusFilter";
import { JobList } from "@/components/Jobs";
import { PageHeader } from "@/components/PortalShell";

export default async function ClientJobs({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const user = await requireRole("CLIENT");
  const { t, fmtDate } = await getI18n();
  const { status } = await searchParams;
  const valid = JOB_STATUSES.includes(status as never) ? status : undefined;
  const jobs = await db.job.findMany({
    where: { site: { clientId: user.clientId ?? "-" }, ...(valid ? { status: valid } : {}) },
    include: { site: true, unit: true, assignee: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <>
      <PageHeader title={t("nav.jobs")} />
      <StatusFilter base="/client/jobs" current={valid} t={t} />
      <JobList jobs={jobs} hrefFor={(j) => `/client/jobs/${j.id}`} t={t} fmt={(d) => fmtDate(d)} empty={t("common.noResults")} />
    </>
  );
}

