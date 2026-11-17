import { getI18n } from "@/i18n";
import { createJobAction } from "@/app/actions/admin";
import { JOB_TYPES, PRIORITIES } from "@/lib/constants";
import { adminOptions, workerLabel } from "@/lib/options";
import { BackLink, PageHeader } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";

export default async function NewJob({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { t } = await getI18n();
  const { error } = await searchParams;
  const { sites, units, workers, templates } = await adminOptions();
  return (
    <div className="mx-auto max-w-2xl">
      <BackLink href="/admin/jobs" label={t("common.back")} />
      <PageHeader title={t("admin.newJob")} />
      <form action={createJobAction} className="card grid gap-4 p-6 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="type">{t("job.type")}</label>
          <select id="type" name="type" className="input">
            {JOB_TYPES.map((x) => <option key={x} value={x}>{t(`type.${x}`)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="priority">{t("job.priority")}</label>
          <select id="priority" name="priority" className="input" defaultValue="NORMAL">
            {PRIORITIES.map((x) => <option key={x} value={x}>{t(`priority.${x}`)}</option>)}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="title">{t("request.title")}</label>
          <input id="title" name="title" className="input" required minLength={3} />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="description">{t("request.details")}</label>
          <textarea id="description" name="description" rows={2} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="siteId">{t("setup.site")}</label>
          <select id="siteId" name="siteId" className="input" required>
            {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="unitId">{t("pay.unit")} ({t("common.optional")})</label>
          <select id="unitId" name="unitId" className="input" defaultValue="">
            <option value="">{t("setup.commonAreas")}</option>
            {units.map((u) => <option key={u.id} value={u.id}>{u.site.name} · {u.label}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="assigneeId">{t("job.assignee")} ({t("common.optional")})</label>
          <select id="assigneeId" name="assigneeId" className="input" defaultValue="">
            <option value="">{t("job.unassigned")}</option>
            {workers.map((w) => <option key={w.id} value={w.id}>{workerLabel(w)}</option>)}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="scheduledFor">{t("job.scheduledFor")}</label>
          <input id="scheduledFor" name="scheduledFor" type="datetime-local" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="checklistTemplateId">{t("job.checklist")} ({t("common.optional")})</label>
          <select id="checklistTemplateId" name="checklistTemplateId" className="input" defaultValue="">
            <option value="">—</option>
            {templates.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select>
        </div>
        {error && <p role="alert" className="text-sm text-urgent-ink sm:col-span-2">{t("request.error")}</p>}
        <SubmitButton className="btn-primary btn sm:col-span-2">{t("admin.createJob")}</SubmitButton>
      </form>
    </div>
  );
}
