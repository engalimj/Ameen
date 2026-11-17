import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { flagProblemAction, saveWorkAction, startJobAction } from "@/app/actions/worker";
import { JobSummary, JobTimeline, jobInclude } from "@/components/Jobs";
import { BackLink } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

const fileCls =
  "block w-full text-sm file:me-3 file:rounded-xl file:border-0 file:bg-sage-tint file:px-4 file:py-2.5 file:font-semibold file:text-sage-deep";

export default async function WorkerJob({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; saved?: string; flagged?: string }>;
}) {
  const user = await requireRole("WORKER");
  const { id } = await params;
  const sp = await searchParams;
  const { t, fmtDateTime, locale } = await getI18n();
  const job = await db.job.findFirst({ where: { id, assigneeId: user.id }, include: jobInclude });
  if (!job) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/worker" label={t("common.back")} />
      {sp.saved && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("worker.saved")}</p>}
      {sp.flagged && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("worker.flagged")}</p>}
      {sp.error && <p role="alert" className="rounded-xl bg-urgent-bg px-4 py-3 text-urgent-ink">{t(sp.error === "photo" ? "worker.needAfterPhoto" : "worker.needChecks")}</p>}

      {(job.status === "NEW" || job.status === "SCHEDULED") && (
        <form action={startJobAction}>
          <input type="hidden" name="jobId" value={job.id} />
          <SubmitButton className="btn-primary btn w-full min-h-14 text-lg">
            <Icon name="clock" /> {t("worker.start")}
          </SubmitButton>
        </form>
      )}

      {job.status === "IN_PROGRESS" ? (
        <form action={saveWorkAction} className="card flex flex-col gap-5">
          <input type="hidden" name="jobId" value={job.id} />
          <div>
            <p className="text-sm text-muted" dir="ltr">#{job.number}</p>
            <h1 className="h1">{job.title}</h1>
            <p className="text-muted">{job.site.name}{job.unit ? ` · ${job.unit.label}` : ""}</p>
            {job.description && <p className="mt-2 text-sm">{job.description}</p>}
          </div>
          {job.checks.length > 0 && (
            <fieldset className="flex flex-col gap-3">
              <legend className="h2 mb-2">{t("job.checklist")}</legend>
              {job.checks.map((c) => (
                <div key={c.id} className="rounded-xl bg-ivory p-3">
                  <p className="font-medium">{locale === "ar" ? c.labelAr : c.labelEn}</p>
                  <div className="mt-2 flex gap-2">
                    {(["OK", "FAIL", "NA"] as const).map((r) => (
                      <label key={r} className="flex min-h-11 flex-1 cursor-pointer items-center justify-center gap-1 rounded-xl border border-line bg-white text-sm has-[:checked]:border-2 has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint">
                        <input type="radio" name={`check_${c.id}`} value={r} defaultChecked={c.result === r} className="sr-only" />
                        {t(`check.${r}`)}
                      </label>
                    ))}
                  </div>
                  <input name={`note_${c.id}`} defaultValue={c.note ?? ""} placeholder={t("worker.checkNote")} className="input mt-2" />
                </div>
              ))}
            </fieldset>
          )}
          <div>
            <label htmlFor="before" className="label">{t("photo.BEFORE")} ({job.photos.filter((p) => p.kind === "BEFORE").length})</label>
            <input id="before" name="before" type="file" accept="image/*" capture="environment" multiple className={fileCls} />
          </div>
          <div>
            <label htmlFor="after" className="label">{t("photo.AFTER")} ({job.photos.filter((p) => p.kind === "AFTER").length})</label>
            <input id="after" name="after" type="file" accept="image/*" capture="environment" multiple className={fileCls} />
            <p className="hint">{t("worker.afterHint")}</p>
          </div>
          <div>
            <label htmlFor="workerNote" className="label">{t("job.workerNote")} <span className="text-muted">({t("common.optional")})</span></label>
            <textarea id="workerNote" name="workerNote" rows={2} className="input" defaultValue={job.workerNote ?? ""} />
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <SubmitButton name="intent" value="save" className="btn-secondary btn flex-1" formNoValidate>{t("common.save")}</SubmitButton>
            <SubmitButton name="intent" value="finish" className="btn-primary btn flex-1">
              <Icon name="check" /> {t("worker.finish")}
            </SubmitButton>
          </div>
        </form>
      ) : (
        <JobSummary job={job} t={t} fmtDateTime={fmtDateTime} locale={locale} />
      )}

      {job.status !== "COMPLETED" && (
        <details className="card">
          <summary className="cursor-pointer font-semibold text-urgent-ink">{t("worker.flagProblem")}</summary>
          <form action={flagProblemAction} className="mt-3 flex flex-col gap-2">
            <input type="hidden" name="jobId" value={job.id} />
            <textarea name="problem" rows={2} className="input" required placeholder={t("worker.problemPh")} />
            <SubmitButton className="btn-danger btn">{t("worker.sendProblem")}</SubmitButton>
          </form>
        </details>
      )}
      <JobTimeline events={job.events} t={t} fmtDateTime={fmtDateTime} />
    </div>
  );
}
