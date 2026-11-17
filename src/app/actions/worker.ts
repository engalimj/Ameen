"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { finishJob, startJob } from "@/lib/jobs";
import { saveFiles } from "@/lib/storage";
import { notifyInApp } from "@/lib/messaging";

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

  if (formData.get("intent") === "finish") {
    const checks = await db.jobCheck.findMany({ where: { jobId: job.id } });
    const hasAfter = after.length > 0 || job.photos.some((p) => p.kind === "AFTER");
    if (checks.some((c) => !c.result)) redirect(`/worker/jobs/${job.id}?error=checks`);
    if (!hasAfter) redirect(`/worker/jobs/${job.id}?error=photo`);
    await finishJob(job.id, user.id, String(formData.get("workerNote") ?? "").slice(0, 1000) || undefined);
    redirect(`/worker?done=${job.number}`);
  }
  redirect(`/worker/jobs/${job.id}?saved=1`);
}

export async function flagProblemAction(formData: FormData) {
  const user = await requireRole("WORKER");
  const job = await ownJob(String(formData.get("jobId")), user.id);
  const note = String(formData.get("problem") ?? "").trim().slice(0, 500);
  if (!note) redirect(`/worker/jobs/${job.id}`);
  await db.jobEvent.create({ data: { jobId: job.id, actorId: user.id, action: "PROBLEM", note } });
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const a of admins) {
    await notifyInApp(a.id, "JOB_PROBLEM", a.locale === "ar" ? `مشكلة في المهمة #${job.number}` : `Problem on job #${job.number}`, note, `/admin/jobs/${job.id}`);
  }
  redirect(`/worker/jobs/${job.id}?flagged=1`);
}
