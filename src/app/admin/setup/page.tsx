import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { createClientAction, createSiteAction, createSubcontractorAction, createUnitAction, createUserAction } from "@/app/actions/admin";
import { LOCALES } from "@/i18n/config";
import { formatSAR } from "@/lib/money";
import { adminOptions } from "@/lib/options";
import { PageHeader } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card">
      <h2 className="h2 mb-3">{title}</h2>
      {children}
    </section>
  );
}

function AddForm({ action, label, children }: { action: (f: FormData) => Promise<void>; label: string; children: React.ReactNode }) {
  return (
    <details className="mt-3 rounded-xl bg-ivory p-3">
      <summary className="cursor-pointer text-sm font-semibold text-sage-deep">{label}</summary>
      <form action={action} className="mt-3 grid gap-3 sm:grid-cols-2">
        {children}
        <SubmitButton className="btn-primary btn sm:col-span-2">{label}</SubmitButton>
      </form>
    </details>
  );
}

function Field({ name, label, ...rest }: { name: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="label" htmlFor={`f-${name}`}>{label}</label>
      <input id={`f-${name}`} name={name} className="input" {...rest} />
    </div>
  );
}

export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string; created?: string }> }) {
  const { t, fmtDate, locale } = await getI18n();
  const sp = await searchParams;
  const { sites, units, clients, subs } = await adminOptions();
  const users = await db.user.findMany({ include: { client: true, unit: { include: { site: true } }, subcontractor: true }, orderBy: [{ role: "asc" }, { name: "asc" }] });

  return (
    <>
      <PageHeader title={t("nav.setup")} sub={t("setup.sub")} />
      {sp.created && <p role="status" className="mb-4 rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("setup.userCreated")}</p>}
      {sp.error && <p role="alert" className="mb-4 rounded-xl bg-urgent-bg px-4 py-3 text-urgent-ink">{t(sp.error === "phone" ? "setup.phoneTaken" : sp.error === "employeeNo" ? "setup.employeeNoTaken" : "setup.userError")}</p>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Section title={t("setup.clients")}>
          <ul className="flex flex-col gap-2 text-sm">
            {clients.map((c) => (
              <li key={c.id} className="flex justify-between gap-3">
                <span className="font-medium">{c.name}</span>
                <span className="text-muted">{fmtDate(c.contractStart)} – {fmtDate(c.contractEnd)}</span>
              </li>
            ))}
          </ul>
          <AddForm action={createClientAction} label={t("setup.addClient")}>
            <Field name="name" label={t("setup.name")} required />
            <Field name="monthlyFee" label={t("setup.monthlyFee")} inputMode="decimal" placeholder="0" />
            <Field name="contractStart" label={t("setup.contractStart")} type="date" required />
            <Field name="contractEnd" label={t("setup.contractEnd")} type="date" required />
          </AddForm>
        </Section>

        <Section title={t("setup.sites")}>
          <ul className="flex flex-col gap-2 text-sm">
            {sites.map((s) => (
              <li key={s.id} className="flex justify-between gap-3">
                <span className="font-medium">{s.name}</span>
                <span className="text-muted">{s.city} · {s.client.name}</span>
              </li>
            ))}
          </ul>
          <AddForm action={createSiteAction} label={t("setup.addSite")}>
            <Field name="name" label={t("setup.name")} required />
            <Field name="city" label={t("setup.city")} required />
            <div className="sm:col-span-2">
              <label className="label" htmlFor="site-client">{t("setup.client")}</label>
              <select id="site-client" name="clientId" className="input">{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
            </div>
          </AddForm>
        </Section>

        <Section title={t("setup.units")}>
          <div className="max-h-72 overflow-y-auto">
            <table className="table">
              <thead><tr><th>{t("pay.unit")}</th><th>{t("line.RENT")}</th><th>{t("line.SERVICE_CHARGE")}</th><th>{t("line.AMEEN_FEE")}</th></tr></thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id}>
                    <td className="font-medium">{u.site.name} · {u.label}</td>
                    <td>{formatSAR(u.monthlyRent, locale)}</td>
                    <td>{formatSAR(u.serviceCharge, locale)}</td>
                    <td>{formatSAR(u.ameenFee, locale)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <AddForm action={createUnitAction} label={t("setup.addUnit")}>
            <div>
              <label className="label" htmlFor="unit-site">{t("setup.site")}</label>
              <select id="unit-site" name="siteId" className="input">{sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            </div>
            <Field name="label" label={t("setup.unitLabel")} required placeholder="Apt 12" />
            <div>
              <label className="label" htmlFor="unit-kind">{t("setup.kind")}</label>
              <select id="unit-kind" name="kind" className="input">
                {["APARTMENT", "VILLA"].map((k) => <option key={k} value={k}>{t(`unitKind.${k}` as never)}</option>)}
              </select>
            </div>
            <Field name="dueDay" label={t("setup.dueDay")} type="number" min={1} max={28} defaultValue={1} />
            <Field name="monthlyRent" label={`${t("line.RENT")} (${t("common.sar")})`} inputMode="decimal" placeholder="0" />
            <Field name="serviceCharge" label={`${t("line.SERVICE_CHARGE")} (${t("common.sar")})`} inputMode="decimal" placeholder="0" />
            <Field name="ameenFee" label={`${t("line.AMEEN_FEE")} (${t("common.sar")})`} inputMode="decimal" placeholder="0" />
          </AddForm>
        </Section>

        <Section title={t("setup.subcontractors")}>
          <ul className="flex flex-col gap-2 text-sm">
            {subs.map((s) => (
              <li key={s.id} className="flex justify-between"><span className="font-medium">{s.name}</span><span className="text-muted" dir="ltr">{s.phone}</span></li>
            ))}
          </ul>
          <AddForm action={createSubcontractorAction} label={t("setup.addSub")}>
            <Field name="name" label={t("setup.name")} required />
            <Field name="phone" label={t("login.phone")} type="tel" required dir="ltr" />
          </AddForm>
        </Section>
      </div>

      <div className="mt-4" />
      <Section title={t("setup.people")}>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr><th>{t("setup.employeeNo")}</th><th>{t("setup.name")}</th><th>{t("setup.role")}</th><th>{t("login.phone")}</th><th>{t("setup.linkedTo")}</th></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td dir="ltr" className="text-start text-muted">{u.employeeNo ?? "—"}</td>
                  <td className="font-medium">{u.name}</td>
                  <td>{t(`portal.${u.role}` as never)}</td>
                  <td dir="ltr" className="text-start">{u.phone}</td>
                  <td className="text-muted">{u.client?.name ?? (u.unit ? `${u.unit.site.name} · ${u.unit.label}` : u.subcontractor?.name ?? "—")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <AddForm action={createUserAction} label={t("setup.addUser")}>
          <Field name="name" label={t("setup.name")} required />
          <Field name="phone" label={t("login.phone")} type="tel" required dir="ltr" placeholder="05X XXX XXXX" />
          <div>
            <label className="label" htmlFor="u-role">{t("setup.role")}</label>
            <select id="u-role" name="role" className="input" defaultValue="TENANT">
              {["TENANT", "WORKER", "CLIENT", "ADMIN"].map((r) => <option key={r} value={r}>{t(`portal.${r}` as never)}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="u-locale">{t("setup.language")}</label>
            <select id="u-locale" name="locale" className="input">
              {Object.entries(LOCALES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="u-unit">{t("setup.unitForTenant")}</label>
            <select id="u-unit" name="unitId" className="input" defaultValue="">
              <option value="">—</option>
              {units.map((u) => <option key={u.id} value={u.id}>{u.site.name} · {u.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="u-sub">{t("setup.subForWorker")}</label>
            <select id="u-sub" name="subcontractorId" className="input" defaultValue="">
              <option value="">—</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="u-client">{t("setup.clientForOwner")}</label>
            <select id="u-client" name="clientId" className="input" defaultValue="">
              <option value="">—</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Field name="employeeNo" label={`${t("setup.employeeNo")} (${t("setup.employeeNoHint")})`} dir="ltr" placeholder="AM-1001" />
          <Field name="email" label={`${t("setup.email")} (${t("common.optional")})`} type="email" dir="ltr" />
        </AddForm>
      </Section>
    </>
  );
}
