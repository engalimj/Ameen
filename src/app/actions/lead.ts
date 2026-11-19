"use server";
import { z } from "zod";
import { db } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import { getLocale } from "@/i18n";
import { notifyInApp } from "@/lib/messaging";

const Lead = z.object({
  name: z.string().trim().min(2).max(80),
  phone: z.string(),
  city: z.string().trim().min(2).max(60),
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
  return { ok: true };
}
