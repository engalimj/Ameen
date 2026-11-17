import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { rateJob } from "@/app/actions/tenant";
import { JobSummary, JobTimeline, jobInclude } from "@/components/Jobs";
import { BackLink } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";

export default async function TenantRequest({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ sent?: string }> }) {
  const user = await requireRole("TENANT");
  const { id } = await params;
  const { sent } = await searchParams;
  const { t, fmtDateTime, locale } = await getI18n();
  const job = await db.job.findFirst({ where: { id, requesterId: user.id }, include: jobInclude });
  if (!job) notFound();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/tenant" label={t("common.back")} />
      {sent && <p role="status" className="rounded-xl bg-done-bg px-4 py-3 text-done-ink">{t("request.sent")}</p>}
      <JobSummary job={job} t={t} fmtDateTime={fmtDateTime} locale={locale} />
      {job.status === "COMPLETED" && !job.rating && (
        <form action={rateJob} className="card flex flex-col gap-3">
          <input type="hidden" name="jobId" value={job.id} />
          <h2 className="h2">{t("rate.title")}</h2>
          <fieldset className="flex gap-2" aria-label={t("job.rating")}>
            {[1, 2, 3, 4, 5].map((n) => (
              <label key={n} className="flex size-12 cursor-pointer items-center justify-center rounded-xl border border-line text-lg has-[:checked]:border-2 has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint">
                <input type="radio" name="rating" value={n} required className="sr-only" />
                {n}★
              </label>
            ))}
          </fieldset>
          <textarea name="note" rows={2} className="input" placeholder={t("rate.notePh")} maxLength={500} />
          <SubmitButton>{t("rate.send")}</SubmitButton>
        </form>
      )}
      <JobTimeline events={job.events} t={t} fmtDateTime={fmtDateTime} />
    </div>
  );
}
