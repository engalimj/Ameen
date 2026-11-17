import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { createScheduleAction, generateTodayAction, toggleScheduleAction } from "@/app/actions/admin";
import { FREQUENCIES } from "@/lib/constants";
import { adminOptions } from "@/lib/options";
import { PageHeader } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Chip } from "@/components/StatusChip";

const SCHEDULE_TYPES = ["CLEANING", "INSPECTION", "MAINTENANCE"] as const;

export default async function Schedules({ searchParams }: { searchParams: Promise<{ generated?: string }> }) {
  const { t, locale } = await getI18n();
  const { generated } = await searchParams;
  const { sites, workers, templates } = await adminOptions();
  const schedules = await db.schedule.findMany({ include: { site: true }, orderBy: { site: { name: "asc" } } });
  const workerName = new Map(workers.map((w) => [w.id, w.name]));
  const dayName = (d: number) => new Intl.DateTimeFormat(locale === "ar" ? "ar-SA" : "en-GB", { weekday: "long" }).format(new Date(2026, 10, 15 + d));

  return (
    <>
      <PageHeader
        title={t("nav.schedules")}
        sub={t("schedules.sub")}
        action={
          <form action={generateTodayAction}>
            <SubmitButton className="btn-secondary btn">{t("schedules.generate")}</SubmitButton>
          </form>
        }
      />
      {generated && <p role="status" className="mb-4 rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("schedules.generated", { count: generated })}</p>}
      <div className="card mb-6 overflow-x-auto p-2">
        <table className="table">
          <thead>
            <tr><th>{t("request.title")}</th><th>{t("setup.site")}</th><th>{t("schedules.repeat")}</th><th>{t("job.assignee")}</th><th></th></tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id} className={s.active ? "" : "opacity-50"}>
                <td>
                  <p className="font-medium">{s.title}</p>
                  <p className="text-xs text-muted">{t(`type.${s.jobType}` as never)}</p>
                </td>
                <td>{s.site.name}</td>
                <td>
                  {t(`freq.${s.frequency}` as never)}
                  {s.frequency === "WEEKLY" && s.dayOfWeek !== null ? ` · ${dayName(s.dayOfWeek)}` : ""}
                  {s.frequency === "MONTHLY" && s.dayOfMonth ? ` · ${s.dayOfMonth}` : ""}
                  <span dir="ltr"> · {s.timeSlot}</span>
                </td>
                <td>{s.defaultAssigneeId ? workerName.get(s.defaultAssigneeId) : <Chip kind="DUE" label={t("job.unassigned")} />}</td>
                <td>
                  <form action={toggleScheduleAction}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="btn-quiet btn min-h-9 text-sm">{s.active ? t("schedules.pause") : t("schedules.resume")}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <form action={createScheduleAction} className="card grid gap-4 p-6 sm:grid-cols-3">
        <h2 className="h2 sm:col-span-3">{t("schedules.new")}</h2>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">{t("request.title")}</label>
          <input id="title" name="title" className="input" required placeholder={t("schedules.titlePh")} />
        </div>
        <div>
          <label className="label" htmlFor="jobType">{t("job.type")}</label>
          <select id="jobType" name="jobType" className="input">
            {SCHEDULE_TYPES.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="siteId">{t("setup.site")}</label>
          <select id="siteId" name="siteId" className="input">
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="frequency">{t("schedules.repeat")}</label>
          <select id="frequency" name="frequency" className="input">
            {FREQUENCIES.map((f) => <option key={f} value={f}>{t(`freq.${f}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="timeSlot">{t("schedules.time")}</label>
          <input id="timeSlot" name="timeSlot" type="time" defaultValue="09:00" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="dayOfWeek">{t("schedules.dayOfWeek")}</label>
          <select id="dayOfWeek" name="dayOfWeek" className="input">
            {[0, 1, 2, 3, 4, 5, 6].map((d) => <option key={d} value={d}>{dayName(d)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="dayOfMonth">{t("schedules.dayOfMonth")}</label>
          <input id="dayOfMonth" name="dayOfMonth" type="number" min={1} max={28} defaultValue={1} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="defaultAssigneeId">{t("job.assignee")}</label>
          <select id="defaultAssigneeId" name="defaultAssigneeId" className="input" defaultValue="">
            <option value="">{t("job.unassigned")}</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="checklistTemplateId">{t("job.checklist")}</label>
          <select id="checklistTemplateId" name="checklistTemplateId" className="input" defaultValue="">
            <option value="">—</option>
            {templates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        <p className="hint sm:col-span-3">{t("schedules.hint")}</p>
        <SubmitButton className="btn-primary btn sm:col-span-3">{t("schedules.save")}</SubmitButton>
      </form>
    </>
  );
}
