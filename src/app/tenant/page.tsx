import Link from "next/link";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { formatSAR } from "@/lib/money";
import { billTotal } from "@/lib/payments";
import { JobList } from "@/components/Jobs";
import { PageHeader } from "@/components/PortalShell";
import { Chip } from "@/components/StatusChip";
import { Icon } from "@/components/Icon";

export default async function TenantHome() {
  const user = await requireRole("TENANT");
  const { t, fmtDate, locale } = await getI18n();
  const unit = user.unitId ? await db.unit.findUnique({ where: { id: user.unitId }, include: { site: true } }) : null;
  const [jobs, bill] = await Promise.all([
    db.job.findMany({ where: { requesterId: user.id }, include: { site: true, unit: true }, orderBy: { createdAt: "desc" }, take: 20 }),
    user.unitId
      ? db.bill.findFirst({ where: { unitId: user.unitId, status: "DUE" }, include: { lines: true }, orderBy: { dueDate: "asc" } })
      : null,
  ]);
  const late = bill && bill.dueDate < new Date();

  return (
    <>
      <PageHeader title={t("tenant.hello", { name: user.name.split(" ")[0] })} sub={unit ? `${unit.site.name} · ${unit.label}` : undefined} />
      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-4">
          <Link href="/tenant/new" className="card flex items-center gap-4 bg-sage-deep text-white hover:bg-sage-deeper">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-white/15">
              <Icon name="plus" size={26} />
            </span>
            <span>
              <span className="block text-lg font-semibold">{t("tenant.newRequest")}</span>
              <span className="text-sm text-white/85">{t("tenant.newRequestSub")}</span>
            </span>
          </Link>
          <h2 className="h2 mt-2">{t("tenant.myRequests")}</h2>
          <JobList jobs={jobs} hrefFor={(j) => `/tenant/requests/${j.id}`} t={t} fmt={(d) => fmtDate(d)} empty={t("tenant.noRequests")} />
        </div>
        <aside className="card h-fit">
          <h2 className="h2">{t("tenant.nextPayment")}</h2>
          {bill ? (
            <>
              <p className="mt-3 text-3xl font-bold">{formatSAR(billTotal(bill.lines), locale)}</p>
              <p className="mt-1 text-sm text-muted">{t("tenant.dueOn", { date: fmtDate(bill.dueDate) })}</p>
              <div className="mt-2">
                <Chip kind={late ? "LATE" : "DUE"} label={t(late ? "bill.LATE" : "bill.DUE")} />
              </div>
              <Link href={`/pay/${bill.payToken}`} className="btn-primary btn mt-4 w-full">{t("pay.payNow")}</Link>
            </>
          ) : (
            <p className="mt-3 text-sm text-muted">{t("tenant.allPaid")}</p>
          )}
        </aside>
      </div>
    </>
  );
}
