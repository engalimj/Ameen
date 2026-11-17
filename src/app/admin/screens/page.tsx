import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { viewAsAction } from "@/app/actions/session";
import { PageHeader } from "@/components/PortalShell";
import { Icon } from "@/components/Icon";

const ROLE_ORDER = ["CLIENT", "TENANT", "WORKER"] as const;

export default async function Screens() {
  const { t } = await getI18n();
  const users = await db.user.findMany({
    where: { role: { in: [...ROLE_ORDER] }, active: true },
    include: { client: true, unit: { include: { site: true } }, subcontractor: true },
    orderBy: [{ employeeNo: "asc" }, { name: "asc" }],
  });
  return (
    <>
      <PageHeader title={t("nav.screens")} sub={t("screens.sub")} />
      <div className="grid gap-4 lg:grid-cols-3">
        {ROLE_ORDER.map((role) => (
          <section key={role} className="card">
            <h2 className="h2">{t(`portal.${role}`)}</h2>
            <p className="mb-3 text-sm text-muted">{t(`screens.${role}`)}</p>
            <ul className="flex flex-col gap-2">
              {users.filter((u) => u.role === role).map((u) => (
                <li key={u.id} className="flex items-center justify-between gap-2 rounded-xl bg-ivory px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{u.employeeNo ? <span dir="ltr" className="text-muted">{u.employeeNo} · </span> : null}{u.name}</p>
                    <p className="truncate text-xs text-muted">
                      {u.client?.name ?? (u.unit ? `${u.unit.site.name} · ${u.unit.label}` : u.subcontractor?.name ?? "")}
                    </p>
                  </div>
                  <form action={viewAsAction}>
                    <input type="hidden" name="userId" value={u.id} />
                    <button className="btn-secondary btn min-h-9 shrink-0 px-3 text-sm">
                      <Icon name="eye" size={16} /> {t("screens.open")}
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
