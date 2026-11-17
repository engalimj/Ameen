import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { isOverdue } from "@/lib/constants";
import { JobList } from "@/components/Jobs";
import { PageHeader, Stat } from "@/components/PortalShell";

export default async function AdminHome() {
  const { t, fmtDateTime } = await getI18n();
  const open = await db.job.findMany({
    where: { status: { not: "COMPLETED" } },
    include: { site: true, unit: true, assignee: true },
    orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
  });
  const now = new Date();
  const [lateBills, newLeads] = await Promise.all([
    db.bill.count({ where: { status: "DUE", dueDate: { lt: now } } }),
    db.lead.count({ where: { status: "NEW" } }),
  ]);
  const unassigned = open.filter((j) => !j.assigneeId);
  const overdue = open.filter((j) => isOverdue(j, now));
  const approval = open.filter((j) => j.status === "NEEDS_APPROVAL");
  return (
    <>
      <PageHeader
        title={t("admin.title")}
        sub={t("admin.sub")}
        action={<Link href="/admin/jobs/new" className="btn-primary btn">{t("admin.newJob")}</Link>}
      />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label={t("admin.unassigned")} value={unassigned.length} tone={unassigned.length ? "warn" : "good"} />
        <Stat label={t("client.overdue")} value={overdue.length} tone={overdue.length ? "warn" : "good"} />
        <Stat label={t("client.needsApproval")} value={approval.length} />
        <Stat label={t("admin.lateBills")} value={lateBills} tone={lateBills ? "warn" : "good"} />
        <Stat label={t("admin.newLeads")} value={newLeads} />
      </div>
      {overdue.length > 0 && (
        <section className="mt-8">
          <h2 className="h2 mb-1">{t("admin.overdueTitle")}</h2>
          <p className="mb-3 text-sm text-muted">{t("admin.overdueSub")}</p>
          <JobList jobs={overdue} hrefFor={(j) => `/admin/jobs/${j.id}`} t={t} fmt={(d) => fmtDateTime(d)} empty="" />
        </section>
      )}
      <section className="mt-8">
        <h2 className="h2 mb-3">{t("admin.toAssign")}</h2>
        <JobList jobs={unassigned} hrefFor={(j) => `/admin/jobs/${j.id}`} t={t} fmt={(d) => fmtDateTime(d)} empty={t("admin.allAssigned")} />
      </section>
    </>
  );
}
