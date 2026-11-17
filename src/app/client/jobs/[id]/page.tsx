import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { approveAction, rejectAction } from "@/app/actions/client";
import { JobSummary, JobTimeline, jobInclude } from "@/components/Jobs";
import { BackLink } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";
import { Icon } from "@/components/Icon";

export default async function ClientJob({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const user = await requireRole("CLIENT");
  const { id } = await params;
  const { error } = await searchParams;
  const { t, fmtDateTime, locale } = await getI18n();
  const job = await db.job.findFirst({ where: { id, site: { clientId: user.clientId ?? "-" } }, include: jobInclude });
  if (!job) notFound();
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <BackLink href="/client" label={t("common.back")} />
      <JobSummary job={job} t={t} fmtDateTime={fmtDateTime} locale={locale} />
      {job.status === "NEEDS_APPROVAL" && (
        <section className="card flex flex-col gap-3">
          <h2 className="h2">{t("client.reviewTitle")}</h2>
          <p className="text-sm text-muted">{t("client.reviewSub")}</p>
          <form action={approveAction}>
            <input type="hidden" name="jobId" value={job.id} />
            <SubmitButton className="btn-primary btn w-full"><Icon name="check" /> {t("client.approve")}</SubmitButton>
          </form>
          <details>
            <summary className="cursor-pointer text-sm font-medium text-urgent-ink">{t("client.reject")}</summary>
            <form action={rejectAction} className="mt-2 flex flex-col gap-2">
              <input type="hidden" name="jobId" value={job.id} />
              <textarea name="reason" rows={2} required className="input" placeholder={t("client.rejectPh")} />
              {error && <p role="alert" className="text-sm text-urgent-ink">{t("client.rejectPh")}</p>}
              <SubmitButton className="btn-danger btn">{t("client.sendBack")}</SubmitButton>
            </form>
          </details>
        </section>
      )}
      <JobTimeline events={job.events} t={t} fmtDateTime={fmtDateTime} />
    </div>
  );
}
