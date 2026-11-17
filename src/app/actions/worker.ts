"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { finishJob, startJob } from "@/lib/jobs";
import { saveFiles } from "@/lib/storage";
import { notifyInApp } from "@/lib/messaging";
import { WORK_OUTCOMES, WORK_PROBLEMS } from "@/lib/constants";
import { makeT } from "@/i18n";

async function ownJob(jobId: string, workerId: string) {
  const job = await db.job.findFirst({ where: { id: jobId, assigneeId: workerId }, include: { checks: true, photos: true } });
  if (!job) redirect("/worker");
  return job;
}

export async function startJobAction(formData: FormData) {
  const user = await requireRole("WORKER");
  const job = await ownJob(String(formData.get("jobId")), user.id);
  if (job.status === "NEW" || job.status === "SCHEDULED") await startJob(job.id, user.id);
  revalidatePath(`/worker/jobs/${job.id}`);
}

/** Saves checklist answers and photos; with intent=finish also sends the job for approval. */
export async function saveWorkAction(formData: FormData) {
  const user = await requireRole("WORKER");
  const job = await ownJob(String(formData.get("jobId")), user.id);
  if (job.status !== "IN_PROGRESS") redirect(`/worker/jobs/${job.id}`);

  for (const c of job.checks) {
    const result = formData.get(`check_${c.id}`);
    const note = String(formData.get(`note_${c.id}`) ?? "").slice(0, 300) || null;
    if (result === "OK" || result === "FAIL" || result === "NA") {
      await db.jobCheck.update({ where: { id: c.id }, data: { result, note } });
    }
  }
  const before = await saveFiles(formData.getAll("before"));
  const after = await saveFiles(formData.getAll("after"));
  if (before.length || after.length) {
    await db.photo.createMany({
      data: [...before.map((url) => ({ jobId: job.id, kind: "BEFORE", url })), ...after.map((url) => ({ jobId: job.id, kind: "AFTER", url }))],
    });
  }

  const outcome = formData.getAll("outcome").map(String).filter((o) => WORK_OUTCOMES.includes(o as never));
  const note = String(formData.get("workerNote") ?? "").trim().slice(0, 1000) || null;
  await db.job.update({ where: { id: job.id }, data: { outcome: outcome.join(",") || null, workerNote: note } });

  if (formData.get("intent") === "finish") {
    const checks = await db.jobCheck.findMany({ where: { jobId: job.id } });
    const hasAfter = after.length > 0 || job.photos.some((p) => p.kind === "AFTER");
    if (checks.some((c) => !c.result)) redirect(`/worker/jobs/${job.id}?error=checks`);
    if (!hasAfter) redirect(`/worker/jobs/${job.id}?error=photo`);
    if (!outcome.length) redirect(`/worker/jobs/${job.id}?error=outcome`);
    await finishJob(job.id, user.id, note ?? undefined);
    // Follow-up needed: tell the Ameen team so they can plan the next visit.
    const followUp = outcome.filter((o) => o.startsWith("NEEDS_"));
    if (followUp.length) {
      const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
      for (const a of admins) {
        const t = makeT(a.locale === "en" ? "en" : "ar");
        await notifyInApp(a.id, "JOB_FOLLOW_UP", t("notify.followUp", { number: job.number }), followUp.map((o) => t(`outcome.${o}` as never)).join(" · "), `/admin/jobs/${job.id}`);
      }
    }
    redirect(`/worker?done=${job.number}`);
  }
  redirect(`/worker/jobs/${job.id}?saved=1`);
}

export async function flagProblemAction(formData: FormData) {
  const user = await requireRole("WORKER");
  const job = await ownJob(String(formData.get("jobId")), user.id);
  const code = String(formData.get("problem") ?? "");
  if (!WORK_PROBLEMS.includes(code as never)) redirect(`/worker/jobs/${job.id}`);
  const extra = String(formData.get("note") ?? "").trim().slice(0, 500);
  // Stored as the code (translated when shown) plus any optional note.
  await db.jobEvent.create({ data: { jobId: job.id, actorId: user.id, action: "PROBLEM", note: extra ? `${code}|${extra}` : code } });
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const a of admins) {
    const t = makeT(a.locale === "en" ? "en" : "ar");
    await notifyInApp(a.id, "JOB_PROBLEM", t("notify.problem", { number: job.number }), [t(`problem.${code}` as never), extra].filter(Boolean).join(" · "), `/admin/jobs/${job.id}`);
  }
  redirect(`/worker/jobs/${job.id}?flagged=1`);
}
