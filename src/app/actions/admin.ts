"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { assignJob, createJob, generateScheduledJobs } from "@/lib/jobs";
import { addBillLine, generateBills, markBillPaid } from "@/lib/payments";
import { runReminders, sendBillReminder } from "@/lib/reminders";
import { normalizePhone } from "@/lib/phone";
import { sarToHalalas } from "@/lib/money";
import { FREQUENCIES, JOB_TYPES, LINE_KINDS, PRIORITIES, ROLES } from "@/lib/constants";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const opt = (f: FormData, k: string) => str(f, k) || null;

/** Parse "YYYY-MM-DDTHH:mm" from a datetime-local input as Riyadh time (UTC+3). */
function riyadhLocal(v: string) {
  const d = new Date(`${v}:00+03:00`);
  return isNaN(d.getTime()) ? null : d;
}

export async function assignAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const jobId = str(formData, "jobId");
  const assigneeId = str(formData, "assigneeId");
  const when = riyadhLocal(str(formData, "scheduledFor"));
  if (!assigneeId || !when) redirect(`/admin/jobs/${jobId}?error=assign`);
  await assignJob(jobId, assigneeId, when, admin.id);
  redirect(`/admin/jobs/${jobId}?assigned=1`);
}

export async function createJobAction(formData: FormData) {
  const admin = await requireRole("ADMIN");
  const parsed = z
    .object({
      type: z.enum(JOB_TYPES),
      title: z.string().min(3).max(120),
      siteId: z.string().min(1),
      priority: z.enum(PRIORITIES),
    })
    .safeParse({ type: str(formData, "type"), title: str(formData, "title"), siteId: str(formData, "siteId"), priority: str(formData, "priority") || "NORMAL" });
  if (!parsed.success) redirect("/admin/jobs/new?error=1");
  const when = riyadhLocal(str(formData, "scheduledFor"));
  const job = await createJob({
    ...parsed.data,
    description: opt(formData, "description") ?? undefined,
    unitId: opt(formData, "unitId"),
    assigneeId: opt(formData, "assigneeId"),
    scheduledFor: when,
    checklistTemplateId: opt(formData, "checklistTemplateId"),
    source: "REQUEST",
    requesterId: admin.id,
    actorId: admin.id,
  });
  redirect(`/admin/jobs/${job.id}`);
}

export async function createScheduleAction(formData: FormData) {
  await requireRole("ADMIN");
  const frequency = str(formData, "frequency");
  const jobType = str(formData, "jobType");
  if (!FREQUENCIES.includes(frequency as never) || !JOB_TYPES.includes(jobType as never)) redirect("/admin/schedules?error=1");
  await db.schedule.create({
    data: {
      siteId: str(formData, "siteId"),
      jobType,
      title: str(formData, "title"),
      frequency,
      dayOfWeek: frequency === "WEEKLY" ? Number(str(formData, "dayOfWeek")) : null,
      dayOfMonth: frequency === "MONTHLY" ? Math.min(28, Math.max(1, Number(str(formData, "dayOfMonth")) || 1)) : null,
      timeSlot: str(formData, "timeSlot") || "09:00",
      defaultAssigneeId: opt(formData, "defaultAssigneeId"),
      checklistTemplateId: opt(formData, "checklistTemplateId"),
    },
  });
  revalidatePath("/admin/schedules");
}

export async function toggleScheduleAction(formData: FormData) {
  await requireRole("ADMIN");
  const s = await db.schedule.findUniqueOrThrow({ where: { id: str(formData, "id") } });
  await db.schedule.update({ where: { id: s.id }, data: { active: !s.active } });
  revalidatePath("/admin/schedules");
}

export async function generateTodayAction() {
  await requireRole("ADMIN");
  const n = await generateScheduledJobs();
  redirect(`/admin/schedules?generated=${n}`);
}

// ---- Payments ----

export async function generateBillsAction(formData: FormData) {
  await requireRole("ADMIN");
  const period = str(formData, "period");
  if (!/^\d{4}-\d{2}$/.test(period)) redirect("/admin/payments");
  const n = await generateBills(period);
  redirect(`/admin/payments?month=${period}&generated=${n}`);
}

export async function markPaidAction(formData: FormData) {
  await requireRole("ADMIN");
  const bill = await markBillPaid(str(formData, "billId"), { gateway: "MANUAL", method: str(formData, "method") || "CASH" });
  redirect(`/admin/payments?month=${bill?.period ?? ""}`);
}

export async function remindNowAction(formData: FormData) {
  await requireRole("ADMIN");
  const billId = str(formData, "billId");
  const n = await sendBillReminder(billId, "MANUAL", true);
  const bill = await db.bill.findUnique({ where: { id: billId } });
  redirect(`/admin/payments?month=${bill?.period ?? ""}&reminded=${n}`);
}

export async function runRemindersAction(formData: FormData) {
  await requireRole("ADMIN");
  const n = await runReminders();
  redirect(`/admin/payments?month=${str(formData, "period")}&reminded=${n}`);
}

export async function addLineAction(formData: FormData) {
  await requireRole("ADMIN");
  const kind = str(formData, "kind");
  const amount = sarToHalalas(str(formData, "amount"));
  if (!LINE_KINDS.includes(kind as never) || amount <= 0) redirect(`/admin/payments`);
  const billId = str(formData, "billId");
  const bill = await db.bill.findUniqueOrThrow({ where: { id: billId } });
  if (bill.status === "DUE") await addBillLine(billId, kind as never, amount, opt(formData, "note") ?? undefined);
  redirect(`/admin/payments?month=${bill.period}`);
}

// ---- Setup: clients, sites, units, subcontractors, people ----

export async function createClientAction(formData: FormData) {
  await requireRole("ADMIN");
  await db.client.create({
    data: {
      name: str(formData, "name"),
      contractStart: new Date(str(formData, "contractStart")),
      contractEnd: new Date(str(formData, "contractEnd")),
      monthlyFee: sarToHalalas(str(formData, "monthlyFee")),
    },
  });
  revalidatePath("/admin/setup");
}

export async function createSiteAction(formData: FormData) {
  await requireRole("ADMIN");
  await db.site.create({ data: { name: str(formData, "name"), city: str(formData, "city"), clientId: str(formData, "clientId") } });
  revalidatePath("/admin/setup");
}

export async function createUnitAction(formData: FormData) {
  await requireRole("ADMIN");
  await db.unit.create({
    data: {
      siteId: str(formData, "siteId"),
      label: str(formData, "label"),
      kind: str(formData, "kind") || "APARTMENT",
      monthlyRent: sarToHalalas(str(formData, "monthlyRent")),
      serviceCharge: sarToHalalas(str(formData, "serviceCharge")),
      ameenFee: sarToHalalas(str(formData, "ameenFee")),
      dueDay: Math.min(28, Math.max(1, Number(str(formData, "dueDay")) || 1)),
    },
  });
  revalidatePath("/admin/setup");
}

export async function createSubcontractorAction(formData: FormData) {
  await requireRole("ADMIN");
  await db.subcontractor.create({ data: { name: str(formData, "name"), phone: str(formData, "phone") } });
  revalidatePath("/admin/setup");
}

export async function createUserAction(formData: FormData) {
  await requireRole("ADMIN");
  const role = str(formData, "role");
  const phone = normalizePhone(str(formData, "phone"));
  if (!ROLES.includes(role as never) || !phone) redirect("/admin/setup?error=user");
  const exists = await db.user.findUnique({ where: { phone } });
  if (exists) redirect("/admin/setup?error=phone");
  await db.user.create({
    data: {
      name: str(formData, "name"),
      phone,
      email: opt(formData, "email"),
      role,
      locale: str(formData, "locale") || "ar",
      clientId: role === "CLIENT" ? opt(formData, "clientId") : null,
      unitId: role === "TENANT" ? opt(formData, "unitId") : null,
      subcontractorId: role === "WORKER" ? opt(formData, "subcontractorId") : null,
    },
  });
  redirect("/admin/setup?created=1");
}

export async function updateLeadAction(formData: FormData) {
  await requireRole("ADMIN");
  await db.lead.update({ where: { id: str(formData, "id") }, data: { status: str(formData, "status") } });
  revalidatePath("/admin/leads");
}
