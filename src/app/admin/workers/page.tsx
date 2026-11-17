import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { isOverdue } from "@/lib/constants";
import { updateEmployeeNoAction } from "@/app/actions/admin";
import { Empty, PageHeader } from "@/components/PortalShell";
import { Chip } from "@/components/StatusChip";

export default async function Workers({ searchParams }: { searchParams: Promise<{ q?: string; error?: string }> }) {
  const { t } = await getI18n();
  const { q, error } = await searchParams;
  const query = (q ?? "").trim();
  const workers = await db.user.findMany({
    where: {
      role: "WORKER",
      ...(query
        ? { OR: [{ employeeNo: { contains: query.toUpperCase() } }, { name: { contains: query } }, { phone: { contains: query.replace(/^0/, "") } }] }
        : {}),
    },
    include: {
      subcontractor: true,
      assigned: { where: { status: { not: "COMPLETED" } }, select: { status: true, scheduledFor: true, createdAt: true, startedAt: true, source: true } },
    },
    orderBy: [{ employeeNo: "asc" }, { name: "asc" }],
  });
  const r = new Date(Date.now() + 3 * 3600_000);
  const endOfToday = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), r.getUTCDate() + 1) - 3 * 3600_000);

  return (
    <>
      <PageHeader title={t("nav.workers")} sub={t("workers.sub")} action={<Link href="/admin/setup" className="btn-secondary btn">{t("setup.addUser")}</Link>} />
      <form className="mb-4 flex gap-2" role="search">
        <input name="q" defaultValue={query} placeholder={t("workers.searchPh")} className="input max-w-sm" aria-label={t("workers.searchPh")} />
        <button className="btn-secondary btn">{t("workers.search")}</button>
      </form>
      {error && <p role="alert" className="mb-4 rounded-xl bg-urgent-bg px-4 py-3 text-urgent-ink">{t("setup.employeeNoTaken")}</p>}
      {workers.length === 0 ? (
        <Empty text={t("common.noResults")} />
      ) : (
        <div className="card overflow-x-auto p-2">
          <table className="table">
            <thead>
              <tr>
                <th>{t("setup.employeeNo")}</th><th>{t("setup.name")}</th><th>{t("workers.company")}</th>
                <th>{t("workers.today")}</th><th>{t("workers.open")}</th><th>{t("client.needsApproval")}</th><th></th>
              </tr>
            </thead>
            <tbody>
              {workers.map((w) => {
                const open = w.assigned.filter((j) => j.status !== "NEEDS_APPROVAL");
                const today = open.filter((j) => !j.scheduledFor || j.scheduledFor < endOfToday).length;
                const waiting = w.assigned.length - open.length;
                const late = w.assigned.filter((j) => isOverdue(j)).length;
                return (
                  <tr key={w.id}>
                    <td>
                      <form action={updateEmployeeNoAction} className="flex gap-1">
                        <input type="hidden" name="id" value={w.id} />
                        <input name="employeeNo" defaultValue={w.employeeNo ?? ""} placeholder="AM-…" dir="ltr" className="input min-h-9 w-28 text-sm" aria-label={t("setup.employeeNo")} />
                        <button className="btn-quiet btn min-h-9 px-2 text-xs">{t("common.save")}</button>
                      </form>
                    </td>
                    <td>
                      <p className="font-medium">{w.name}</p>
                      <p className="text-xs text-muted" dir="ltr">{w.phone.replace("+966", "0")}</p>
                    </td>
                    <td className="text-muted">{w.subcontractor?.name ?? "—"}</td>
                    <td className="font-semibold">{today}</td>
                    <td>
                      {open.length} {late > 0 && <Chip kind="OVERDUE" label={t("status.OVERDUE")} />}
                    </td>
                    <td>{waiting}</td>
                    <td><Link href={`/admin/jobs?worker=${w.id}`} className="text-sm font-medium text-sage-deep">{t("workers.viewJobs")}</Link></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
