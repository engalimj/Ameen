import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { assignAction } from "@/app/actions/admin";
import { JobSummary, JobTimeline, jobInclude } from "@/components/Jobs";
import { BackLink } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { adminOptions, riyadhInputValue } from "@/lib/options";

export default async function AdminJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ assigned?: string; error?: string }> }) {
  const { id } = await params;
  const sp = await searchParams;
  const { t, fmtDateTime, locale } = await getI18n();
  const job = await db.job.findUnique({ where: { id }, include: jobInclude });
  if (!job) notFound();
  const { workers } = await adminOptions();
  const canAssign = job.status === "NEW" || job.status === "SCHEDULED";
  const defaultWhen = riyadhInputValue(job.scheduledFor ?? new Date(Date.now() + 3600_000));
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/admin/jobs" label={t("common.back")} />
      {sp.assigned && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("admin.assigned")}</p>}
      {canAssign && (
        <form action={assignAction} className="card flex flex-col gap-3">
          <input type="hidden" name="jobId" value={job.id} />
          <h2 className="h2">{job.assigneeId ? t("admin.reassign") : t("admin.assign")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="assigneeId" className="label">{t("job.assignee")}</label>
              <select id="assigneeId" name="assigneeId" className="input" defaultValue={job.assigneeId ?? ""} required>
                <option value="" disabled>{t("common.choose")}</option>
                {workers.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}{w.subcontractor ? ` · ${w.subcontractor.name}` : ""}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="scheduledFor" className="label">{t("job.scheduledFor")}</label>
              <input id="scheduledFor" name="scheduledFor" type="datetime-local" className="input" defaultValue={defaultWhen} required />
            </div>
          </div>
          {sp.error && <p role="alert" className="text-sm text-urgent-ink">{t("admin.assignError")}</p>}
          <SubmitButton>{t("admin.assignSave")}</SubmitButton>
        </form>
      )}
      <JobSummary job={job} t={t} fmtDateTime={fmtDateTime} locale={locale} />
      <JobTimeline events={job.events} t={t} fmtDateTime={fmtDateTime} />
    </div>
  );
}
