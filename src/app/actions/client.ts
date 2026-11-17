"use server";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { approveJob, rejectJob } from "@/lib/jobs";

async function clientJob(jobId: string, clientId: string | null) {
  const job = await db.job.findFirst({ where: { id: jobId, site: { clientId: clientId ?? "-" } } });
  if (!job) redirect("/client");
  return job;
}

export async function approveAction(formData: FormData) {
  const user = await requireRole("CLIENT");
  const job = await clientJob(String(formData.get("jobId")), user.clientId);
  await approveJob(job.id, user.id);
  redirect(`/client/jobs/${job.id}`);
}

export async function rejectAction(formData: FormData) {
  const user = await requireRole("CLIENT");
  const job = await clientJob(String(formData.get("jobId")), user.clientId);
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 500);
  if (!reason) redirect(`/client/jobs/${job.id}?error=reason`);
  await rejectJob(job.id, user.id, reason);
  redirect(`/client/jobs/${job.id}`);
}
