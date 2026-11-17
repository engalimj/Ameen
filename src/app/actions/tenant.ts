"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { createJob } from "@/lib/jobs";
import { saveFiles } from "@/lib/storage";

const RequestSchema = z.object({
  category: z.enum(["PLUMBING", "ELECTRICAL", "AC", "CLEANING", "OTHER"]),
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().max(1000).optional(),
  priority: z.enum(["NORMAL", "URGENT"]),
});

export async function createRequest(formData: FormData) {
  const user = await requireRole("TENANT");
  if (!user.unitId) redirect("/tenant");
  const unit = await db.unit.findUniqueOrThrow({ where: { id: user.unitId } });
  const parsed = RequestSchema.safeParse({
    category: formData.get("category"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    priority: formData.get("priority") ?? "NORMAL",
  });
  if (!parsed.success) redirect("/tenant/new?error=1");
  const photoUrls = await saveFiles(formData.getAll("photos"));
  const job = await createJob({
    type: parsed.data.category === "CLEANING" ? "CLEANING" : "REPAIR",
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    siteId: unit.siteId,
    unitId: unit.id,
    requesterId: user.id,
    source: "REQUEST",
    photoUrls,
    actorId: user.id,
  });
  redirect(`/tenant/requests/${job.id}?sent=1`);
}

export async function rateJob(formData: FormData) {
  const user = await requireRole("TENANT");
  const jobId = String(formData.get("jobId"));
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating")) || 0));
  const note = String(formData.get("note") ?? "").slice(0, 500) || null;
  await db.job.update({
    where: { id: jobId, requesterId: user.id, status: "COMPLETED" },
    data: { rating, ratingNote: note, events: { create: { action: "RATED", actorId: user.id, note: `${rating}/5` } } },
  });
  revalidatePath(`/tenant/requests/${jobId}`);
}
