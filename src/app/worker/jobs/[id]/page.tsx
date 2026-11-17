import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { flagProblemAction, saveWorkAction, startJobAction } from "@/app/actions/worker";
import { JobPhotos, JobSummary, JobTimeline, jobInclude } from "@/components/Jobs";
import { CheckAnswer, OUTCOME_ICONS, OptionTiles, PROBLEM_ICONS } from "@/components/WorkerOptions";
import { PhotoPicker } from "@/components/PhotoPicker";
import { WORK_OUTCOMES, WORK_PROBLEMS } from "@/lib/constants";
import { BackLink } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

function Step({ n, title }: { n: number; title: string }) {
  return (
    <h2 className="flex items-center gap-3 text-lg font-semibold">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sage-deep text-white">{n}</span>
      {title}
    </h2>
  );
}

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
  const outcomeLabels = Object.fromEntries(WORK_OUTCOMES.map((o) => [o, t(`outcome.${o}`)]));
  const problemLabels = Object.fromEntries(WORK_PROBLEMS.map((o) => [o, t(`problem.${o}`)]));

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/worker" label={t("common.back")} />
      {sp.saved && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("worker.saved")}</p>}
      {sp.flagged && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("worker.flagged")}</p>}
      {sp.error && <p role="alert" className="rounded-xl bg-urgent-bg px-4 py-3 text-urgent-ink">{t(sp.error === "photo" ? "worker.needAfterPhoto" : sp.error === "outcome" ? "worker.needOutcome" : "worker.needChecks")}</p>}

      {(job.status === "NEW" || job.status === "SCHEDULED") && (
        <form action={startJobAction}>
          <input type="hidden" name="jobId" value={job.id} />
          <SubmitButton className="btn-primary btn w-full min-h-16 text-xl">
            <Icon name="clock" size={26} /> {t("worker.start")}
          </SubmitButton>
        </form>
      )}

      {job.status === "IN_PROGRESS" ? (
        <form action={saveWorkAction} className="flex flex-col gap-4">
          <input type="hidden" name="jobId" value={job.id} />
          <section className="card">
            <p className="text-sm text-muted" dir="ltr">#{job.number}</p>
            <h1 className="h1">{job.title}</h1>
            <p className="flex items-center gap-1 text-muted"><Icon name="pin" size={16} />{job.site.name}{job.unit ? ` · ${job.unit.label}` : ""}</p>
            {job.description && <p className="mt-2">{job.description}</p>}
            <JobPhotos photos={job.photos.filter((p) => p.kind === "REQUEST")} t={t} />
          </section>

          <section className="card flex flex-col gap-3">
            <Step n={1} title={t("worker.step.before")} />
            <PhotoPicker name="before" label={t("photo.BEFORE")} existing={job.photos.filter((p) => p.kind === "BEFORE").length} addMore={t("worker.tapToChange")} />
          </section>

          {job.checks.length > 0 && (
            <section className="card flex flex-col gap-3">
              <Step n={2} title={t("job.checklist")} />
              {job.checks.map((c) => (
                <div key={c.id} className="rounded-xl bg-ivory p-3">
                  <p className="text-[17px] font-semibold">{locale === "ar" ? c.labelAr : c.labelEn}</p>
                  <CheckAnswer name={`check_${c.id}`} value={c.result} labels={{ OK: t("check.OK"), FAIL: t("check.FAIL"), NA: t("check.NA") }} />
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-muted">{t("worker.addNote")}</summary>
                    <input name={`note_${c.id}`} defaultValue={c.note ?? ""} className="input mt-2" />
                  </details>
                </div>
              ))}
            </section>
          )}

          <section className="card flex flex-col gap-3">
            <Step n={job.checks.length ? 3 : 2} title={t("worker.step.after")} />
            <PhotoPicker name="after" label={t("photo.AFTER")} existing={job.photos.filter((p) => p.kind === "AFTER").length} addMore={t("worker.tapToChange")} />
          </section>

          <section className="card flex flex-col gap-3">
            <Step n={job.checks.length ? 4 : 3} title={t("worker.step.outcome")} />
            <p className="-mt-1 text-sm text-muted">{t("worker.outcomeHint")}</p>
            <OptionTiles name="outcome" type="checkbox" options={WORK_OUTCOMES} icons={OUTCOME_ICONS} labels={outcomeLabels} selected={job.outcome?.split(",") ?? []} />
            <details>
              <summary className="cursor-pointer text-sm text-muted">{t("worker.addNote")}</summary>
              <textarea id="workerNote" name="workerNote" rows={2} className="input mt-2" defaultValue={job.workerNote ?? ""} />
            </details>
          </section>

          <div className="sticky bottom-20 z-10 md:bottom-4">
            <SubmitButton name="intent" value="finish" className="btn-primary btn min-h-16 w-full text-lg shadow-lg">
              <Icon name="check" size={24} /> {t("worker.finish")}
            </SubmitButton>
          </div>
          <div>
            <SubmitButton name="intent" value="save" className="btn-secondary btn w-full" formNoValidate>{t("worker.saveForLater")}</SubmitButton>
          </div>
        </form>
      ) : (
        <JobSummary job={job} t={t} fmtDateTime={fmtDateTime} locale={locale} />
      )}

      {job.status !== "COMPLETED" && job.status !== "NEEDS_APPROVAL" && (
        <details className="card">
          <summary className="flex cursor-pointer items-center gap-2 text-lg font-semibold text-urgent-ink">
            <Icon name="alert" size={24} /> {t("worker.flagProblem")}
          </summary>
          <form action={flagProblemAction} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="jobId" value={job.id} />
            <OptionTiles name="problem" type="radio" options={WORK_PROBLEMS} icons={PROBLEM_ICONS} labels={problemLabels} required />
            <details>
              <summary className="cursor-pointer text-sm text-muted">{t("worker.addNote")}</summary>
              <textarea name="note" rows={2} className="input mt-2" />
            </details>
            <SubmitButton className="btn-danger btn min-h-14 text-lg">{t("worker.sendProblem")}</SubmitButton>
          </form>
        </details>
      )}
      <JobTimeline events={job.events} t={t} fmtDateTime={fmtDateTime} />
    </div>
  );
}
