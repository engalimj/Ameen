import "server-only";
// Payment reminder schedule (decided by Ali):
// 3 days before the due date, on the due date, 3 days after, then weekly until paid.
// Run runReminders() once a day (see /api/cron/daily). Each stage is sent once per
// bill and channel; if several stages were missed, only the latest one is sent.
import { db } from "./db";
import { sendWhatsApp, notifyInApp } from "./messaging";
import { billTotal, payLink } from "./payments";
import { formatSAR } from "./money";

const DAY = 86400_000;

export function currentStage(dueDate: Date, now = new Date()): string | null {
  const diffDays = Math.floor((startOfDay(now) - startOfDay(dueDate)) / DAY);
  if (diffDays < -3) return null;
  if (diffDays < 0) return "BEFORE_3";
  if (diffDays < 3) return "DUE";
  if (diffDays < 10) return "AFTER_3";
  return `WEEKLY_${Math.floor((diffDays - 3) / 7)}`;
}

function startOfDay(d: Date) {
  // Riyadh is UTC+3 all year
  const r = new Date(d.getTime() + 3 * 3600_000);
  return Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), r.getUTCDate());
}

export function reminderText(locale: string, v: { name: string; unit: string; period: string; amount: string; due: string; link: string; late: boolean }) {
  if (locale === "ar") {
    return v.late
      ? `مرحبًا ${v.name}، نذكّرك بأن فاتورة ${v.unit} لشهر ${v.period} بمبلغ ${v.amount} تأخر سدادها منذ ${v.due}. ادفع بسهولة عبر مدى أو Apple Pay أو STC Pay: ${v.link}\nأمين · منشأتك في أيدٍ أمينة`
      : `مرحبًا ${v.name}، فاتورة ${v.unit} لشهر ${v.period} بمبلغ ${v.amount} تستحق في ${v.due}. ادفع بسهولة عبر مدى أو Apple Pay أو STC Pay: ${v.link}\nأمين · منشأتك في أيدٍ أمينة`;
  }
  return v.late
    ? `Hello ${v.name}, a reminder that the ${v.period} bill for ${v.unit} (${v.amount}) was due on ${v.due}. Pay with mada, Apple Pay or STC Pay: ${v.link}\nAmeen · Your facilities, in trusted hands`
    : `Hello ${v.name}, the ${v.period} bill for ${v.unit} (${v.amount}) is due on ${v.due}. Pay with mada, Apple Pay or STC Pay: ${v.link}\nAmeen · Your facilities, in trusted hands`;
}

export async function sendBillReminder(billId: string, stage: string, force = false) {
  const bill = await db.bill.findUnique({
    where: { id: billId },
    include: { lines: true, unit: { include: { site: true, tenants: { where: { active: true, role: "TENANT" } } } } },
  });
  if (!bill || bill.status !== "DUE") return 0;
  if (!force) {
    const done = await db.reminder.findUnique({ where: { billId_stage_channel: { billId, stage, channel: "WHATSAPP" } } });
    if (done) return 0;
  }
  let sent = 0;
  const details: string[] = [];
  for (const tenant of bill.unit.tenants) {
    const locale = tenant.locale;
    const amount = formatSAR(billTotal(bill.lines), locale);
    const due = new Intl.DateTimeFormat(locale === "ar" ? "ar-SA-u-nu-latn" : "en-GB", { dateStyle: "medium", calendar: "gregory" }).format(bill.dueDate);
    const unit = `${bill.unit.site.name} · ${bill.unit.label}`;
    const link = payLink(bill.payToken);
    const text = reminderText(locale, { name: tenant.name, unit, period: bill.period, amount, due, link, late: stage !== "BEFORE_3" && stage !== "DUE" });
    const res = await sendWhatsApp(tenant.phone, text, {
      name: "payment_reminder",
      language: locale,
      params: [tenant.name, unit, bill.period, amount, due, link],
    });
    await notifyInApp(tenant.id, "PAYMENT_REMINDER", locale === "ar" ? "تذكير بالدفع" : "Payment reminder", text, "/tenant/payments");
    details.push(`${tenant.phone}: ${res.ok ? "ok" : "failed"}${res.detail ? ` (${res.detail})` : ""}`);
    if (res.ok) sent++;
  }
  await db.reminder.create({
    data: {
      billId,
      stage: force ? `MANUAL_${Date.now()}` : stage,
      channel: "WHATSAPP",
      status: sent > 0 ? "SENT" : bill.unit.tenants.length ? "FAILED" : "SKIPPED",
      detail: details.join("; ") || "no tenant",
    },
  });
  return sent;
}

export async function runReminders(now = new Date()) {
  const bills = await db.bill.findMany({ where: { status: "DUE" }, select: { id: true, dueDate: true } });
  let sent = 0;
  for (const b of bills) {
    const stage = currentStage(b.dueDate, now);
    if (stage) sent += await sendBillReminder(b.id, stage);
  }
  return sent;
}
