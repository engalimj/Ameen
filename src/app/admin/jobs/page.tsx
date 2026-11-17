import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { JOB_STATUSES } from "@/lib/constants";
import { JobList } from "@/components/Jobs";
import { PageHeader } from "@/components/PortalShell";
import { StatusFilter } from "@/components/StatusFilter";

export default async function AdminJobs({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { t, fmtDateTime } = await getI18n();
  const { status } = await searchParams;
  const valid = JOB_STATUSES.includes(status as never) ? status : undefined;
  const jobs = await db.job.findMany({
    where: valid ? { status: valid } : {},
    include: { site: true, unit: true, assignee: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return (
    <>
      <PageHeader title={t("nav.jobs")} action={<Link href="/admin/jobs/new" className="btn-primary btn">{t("admin.newJob")}</Link>} />
      <StatusFilter base="/admin/jobs" current={valid} t={t} />
      <JobList jobs={jobs} hrefFor={(j) => `/admin/jobs/${j.id}`} t={t} fmt={(d) => fmtDateTime(d)} empty={t("common.noResults")} />
    </>
  );
}
