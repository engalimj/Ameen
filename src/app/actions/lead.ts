"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getLocale } from "@/i18n";
import { notifyInApp, sendEmail } from "@/lib/messaging";

const Lead = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string(),
  city: z.string().trim().min(2).max(60),
  role: z.enum(["OWNER", "ASSOCIATION"]),
  siteType: z.enum(["COMPOUND", "BUILDING", "VILLAS"]),
  units: z.enum(["LT20", "20_50", "50_150", "GT150"]),
  services: z.array(z.enum(["CLEANING", "INSPECTION", "MAINTENANCE", "REPAIR", "COLLECTION"])).min(1),
});

export async function createLead(input: unknown): Promise<{ ok: boolean; error?: "phone" | "invalid" }> {
  const parsed = Lead.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const phone = normalizePhone(parsed.data.phone);
  if (!phone) return { ok: false, error: "phone" };
  const locale = await getLocale();
  await db.lead.create({
    data: { ...parsed.data, phone, services: parsed.data.services.join(","), locale },
  });
  const admins = await db.user.findMany({ where: { role: "ADMIN", active: true } });
  for (const a of admins) {
    await notifyInApp(a.id, "LEAD", a.locale === "ar" ? "طلب فحص مجاني جديد" : "New free inspection request", `${parsed.data.name} · ${phone}`, "/admin/leads");
  }
  await emailLead({ ...parsed.data, phone, locale });
  return { ok: true };
}

const LABELS: Record<string, string> = {
  OWNER: "Property owner · مالك العقار", ASSOCIATION: "Owners' association · اتحاد الملاك",
  COMPOUND: "Residential compound · مجمع سكني", BUILDING: "Apartment building · عمارة سكنية", VILLAS: "Villas · فلل",
  LT20: "Under 20", "20_50": "20 – 50", "50_150": "50 – 150", GT150: "Over 150",
  CLEANING: "Daily cleaning · نظافة يومية", INSPECTION: "Periodic inspection · فحص دوري", MAINTENANCE: "Regular maintenance · صيانة منتظمة",
  REPAIR: "Repairs on request · إصلاح عند الطلب", COLLECTION: "Payment collection · تحصيل المدفوعات",
};

/** Every landing page request is also emailed to the team (LEAD_EMAIL, default tryameen.sa@gmail.com). */
async function emailLead(l: z.infer<typeof Lead> & { phone: string; locale: string }) {
  const to = process.env.LEAD_EMAIL ?? "tryameen.sa@gmail.com";
  const wa = `https://wa.me/${l.phone.replace("+", "")}`;
  const body = [
    "New free inspection request · طلب فحص مجاني جديد",
    "",
    `Name · الاسم: ${l.name}`,
    `Mobile · الجوال: ${l.phone}  (WhatsApp: ${wa})`,
    `City · المدينة: ${l.city}`,
    `Who · الصفة: ${LABELS[l.role]}`,
    `Property · الموقع: ${LABELS[l.siteType]}`,
    `Units · الوحدات: ${LABELS[l.units]}`,
    `Services · الخدمات: ${l.services.map((s) => LABELS[s]).join(", ")}`,
    `Language · اللغة: ${l.locale}`,
    "",
    `All requests · كل الطلبات: ${process.env.APP_URL ?? ""}/admin/leads`,
  ].join("\n");
  await sendEmail(to, `New inspection request · طلب فحص جديد: ${l.name} (${l.city})`, body);
}
