import "server-only";
import { db } from "./db";
import { notifyInApp } from "./messaging";
import type { JobType, Priority } from "./constants";

async function nextJobNumber() {
  const c = await db.counter.upsert({
    where: { name: "job" },
    create: { name: "job", value: 1001 },
    update: { value: { increment: 1 } },
  });
  return c.value;
}

type Lines = { ar: string; en: string }[];

async function checklistFor(templateId?: string | null) {
  if (!templateId) return [];
  const tpl = await db.checklistTemplate.findUnique({ where: { id: templateId } });
  if (!tpl) return [];
  return (JSON.parse(tpl.items) as Lines).map((it, index) => ({ index, labelAr: it.ar, labelEn: it.en }));
}

async function notifyAdmins(kind: string, ar: [string, string], en: [string, string], link: string) {
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const a of admins) await notifyInApp(a.id, kind, a.locale === "ar" ? ar[0] : en[0], a.locale === "ar" ? ar[1] : en[1], link);
}

async function notifyUser(userId: string | null | undefined, kind: string, ar: [string, string], en: [string, string], link: string) {
  if (!userId) return;
  const u = await db.user.findUnique({ where: { id: userId } });
  if (u) await notifyInApp(u.id, kind, u.locale === "ar" ? ar[0] : en[0], u.locale === "ar" ? ar[1] : en[1], link);
}

async function notifyClient(siteId: string, kind: string, ar: [string, string], en: [string, string], link: string) {
  const site = await db.site.findUnique({ where: { id: siteId }, include: { client: { include: { users: true } } } });
  for (const u of site?.client.users ?? []) if (u.role === "CLIENT") await notifyUser(u.id, kind, ar, en, link);
}

export async function createJob(input: {
  type: JobType;
  title: string;
  description?: string;
  priority?: Priority;
  siteId: string;
  unitId?: string | null;
  requesterId?: string | null;
  assigneeId?: string | null;
  scheduledFor?: Date | null;
  source?: "REQUEST" | "SCHEDULE" | "INSPECTION";
  scheduleId?: string;
  checklistTemplateId?: string | null;
  parentJobId?: string;
  photoUrls?: string[];
  actorId?: string;
}) {
  const number = await nextJobNumber();
  const checks = await checklistFor(input.checklistTemplateId);
  const status = input.assigneeId && input.scheduledFor ? "SCHEDULED" : "NEW";
  const job = await db.job.create({
    data: {
      number,
      type: input.type,
      title: input.title,
      description: input.description,
      priority: input.priority ?? "NORMAL",
      status,
      source: input.source ?? "REQUEST",
      siteId: input.siteId,
      unitId: input.unitId ?? null,
      requesterId: input.requesterId ?? null,
      assigneeId: input.assigneeId ?? null,
      scheduledFor: input.scheduledFor ?? null,
      scheduleId: input.scheduleId,
      checklistTemplateId: input.checklistTemplateId ?? null,
      parentJobId: input.parentJobId,
      checks: { create: checks },
      photos: { create: (input.photoUrls ?? []).map((url) => ({ kind: "REQUEST", url })) },
      events: { create: { action: "CREATED", actorId: input.actorId } },
    },
  });
  if (job.source === "REQUEST" || job.source === "INSPECTION") {
    await notifyAdmins(
      "JOB_NEW",
      [`طلب جديد #${number}`, job.title],
      [`New request #${number}`, job.title],
      `/admin/jobs/${job.id}`,
    );
  }
  if (job.assigneeId) {
    await notifyUser(job.assigneeId, "JOB_ASSIGNED", [`مهمة جديدة #${number}`, job.title], [`New job #${number}`, job.title], `/worker/jobs/${job.id}`);
  }
  return job;
}

export async function assignJob(jobId: string, assigneeId: string, scheduledFor: Date, actorId: string) {
  const job = await db.job.update({
    where: { id: jobId },
    data: { assigneeId, scheduledFor, status: "SCHEDULED", events: { create: { action: "ASSIGNED", actorId } } },
  });
  await notifyUser(assigneeId, "JOB_ASSIGNED", [`مهمة جديدة #${job.number}`, job.title], [`New job #${job.number}`, job.title], `/worker/jobs/${job.id}`);
  await notifyUser(job.requesterId, "JOB_SCHEDULED", [`تمت جدولة طلبك #${job.number}`, job.title], [`Your request #${job.number} is scheduled`, job.title], `/tenant/requests/${job.id}`);
  return job;
}

export async function startJob(jobId: string, workerId: string) {
  const job = await db.job.update({
    where: { id: jobId, assigneeId: workerId },
    data: { status: "IN_PROGRESS", startedAt: new Date(), events: { create: { action: "STARTED", actorId: workerId } } },
  });
  await notifyUser(job.requesterId, "JOB_STARTED", [`بدأ العمل على طلبك #${job.number}`, job.title], [`Work started on #${job.number}`, job.title], `/tenant/requests/${job.id}`);
  return job;
}

/** Worker finishes. Failed inspection items create repair jobs automatically. */
export async function finishJob(jobId: string, workerId: string, note: string | undefined) {
  const job = await db.job.update({
    where: { id: jobId, assigneeId: workerId },
    data: {
      status: "NEEDS_APPROVAL",
      finishedAt: new Date(),
      workerNote: note,
      events: { create: { action: "FINISHED", actorId: workerId, note } },
    },
    include: { checks: true },
  });
  if (job.type === "INSPECTION") {
    for (const c of job.checks.filter((c) => c.result === "FAIL")) {
      await createJob({
        type: "REPAIR",
        title: `${c.labelAr} · ${c.labelEn}`,
        description: c.note ?? undefined,
        siteId: job.siteId,
        unitId: job.unitId,
        source: "INSPECTION",
        parentJobId: job.id,
        actorId: workerId,
      });
    }
  }
  await notifyClient(job.siteId, "JOB_NEEDS_APPROVAL", [`مهمة #${job.number} تحتاج موافقتك`, job.title], [`Job #${job.number} needs your approval`, job.title], `/client/jobs/${job.id}`);
  return job;
}

export async function approveJob(jobId: string, actorId: string) {
  const job = await db.job.update({
    where: { id: jobId, status: "NEEDS_APPROVAL" },
    data: { status: "COMPLETED", approvedAt: new Date(), events: { create: { action: "APPROVED", actorId } } },
  });
  await notifyUser(job.requesterId, "JOB_DONE", [`اكتمل طلبك #${job.number}`, "قيّم الخدمة من صفحة الطلب"], [`Request #${job.number} completed`, "Rate the service from the request page"], `/tenant/requests/${job.id}`);
  return job;
}

export async function rejectJob(jobId: string, actorId: string, reason: string) {
  const job = await db.job.update({
    where: { id: jobId, status: "NEEDS_APPROVAL" },
    data: {
      status: "IN_PROGRESS",
      rejectedReason: reason,
      finishedAt: null,
      events: { create: { action: "REJECTED", actorId, note: reason } },
    },
  });
  await notifyUser(job.assigneeId, "JOB_REOPENED", [`أُعيد فتح المهمة #${job.number}`, reason], [`Job #${job.number} reopened`, reason], `/worker/jobs/${job.id}`);
  await notifyAdmins("JOB_REOPENED", [`أُعيد فتح المهمة #${job.number}`, reason], [`Job #${job.number} reopened`, reason], `/admin/jobs/${job.id}`);
  return job;
}

// Riyadh is UTC+3 all year (no daylight saving), so we work in that offset
// regardless of the server's own time zone.
const RIYADH_MS = 3 * 3600_000;

function riyadhDay(now: Date) {
  const r = new Date(now.getTime() + RIYADH_MS);
  return { y: r.getUTCFullYear(), m: r.getUTCMonth(), d: r.getUTCDate(), dow: r.getUTCDay() };
}

function dueToday(s: { frequency: string; dayOfWeek: number | null; dayOfMonth: number | null }, day: { d: number; dow: number }) {
  if (s.frequency === "DAILY") return true;
  if (s.frequency === "WEEKLY") return s.dayOfWeek === day.dow;
  if (s.frequency === "MONTHLY") return s.dayOfMonth === day.d;
  return false;
}

/** Create today's jobs from active recurring schedules. Safe to run more than once a day. */
export async function generateScheduledJobs(now = new Date()) {
  const day = riyadhDay(now);
  const startOfDay = new Date(Date.UTC(day.y, day.m, day.d) - RIYADH_MS);
  const schedules = await db.schedule.findMany({ where: { active: true } });
  let created = 0;
  for (const s of schedules) {
    if (!dueToday(s, day)) continue;
    if (s.lastGeneratedFor && s.lastGeneratedFor.getTime() >= startOfDay.getTime()) continue;
    const [h, m] = s.timeSlot.split(":").map(Number);
    const when = new Date(startOfDay.getTime() + ((h || 9) * 60 + (m || 0)) * 60_000);
    await createJob({
      type: s.jobType as JobType,
      title: s.title,
      siteId: s.siteId,
      assigneeId: s.defaultAssigneeId,
      scheduledFor: when,
      source: "SCHEDULE",
      scheduleId: s.id,
      checklistTemplateId: s.checklistTemplateId,
    });
    await db.schedule.update({ where: { id: s.id }, data: { lastGeneratedFor: startOfDay } });
    created++;
  }
  return created;
}
