import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { updateLeadAction } from "@/app/actions/admin";
import { Empty, PageHeader } from "@/components/PortalShell";

const STATUSES = ["NEW", "CONTACTED", "WON", "LOST"] as const;

export default async function Leads() {
  const { t, fmtDateTime } = await getI18n();
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <>
      <PageHeader title={t("nav.leads")} sub={t("leads.sub")} />
      {leads.length === 0 ? (
        <Empty text={t("leads.empty")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {leads.map((l) => (
            <li key={l.id} className="card flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{l.name}</p>
                <p className="text-sm" dir="ltr">
                  <a href={`tel:${l.phone}`} className="text-sage-deep">{l.phone}</a> ·{" "}
                  <a href={`https://wa.me/${l.phone.replace("+", "")}`} target="_blank" rel="noreferrer" className="text-sage-deep">WhatsApp</a>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {l.role ? `${t(`leadRole.${l.role}` as never)} · ` : ""}{t(`siteType.${l.siteType}` as never)} · {l.units} {t("leads.units")}{l.city ? ` · ${l.city}` : ""}
                </p>
                <p className="text-sm text-muted">{l.services.split(",").map((s) => t(`service.${s}` as never)).join("، ")}</p>
                <p className="mt-1 text-xs text-muted">{fmtDateTime(l.createdAt)}</p>
              </div>
              <form action={updateLeadAction} className="flex gap-2">
                <input type="hidden" name="id" value={l.id} />
                <select name="status" defaultValue={l.status} className="input min-h-9 w-auto text-sm" aria-label={t("pay.status")}>
                  {STATUSES.map((s) => <option key={s} value={s}>{t(`leadStatus.${s}`)}</option>)}
                </select>
                <button className="btn-secondary btn min-h-9 text-sm">{t("common.save")}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
