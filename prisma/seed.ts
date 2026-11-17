// Sample data for a Saudi residential compound. Amounts are PLACEHOLDERS
// until real prices are agreed. Run: npm run db:seed
import { PrismaClient } from "@prisma/client";
import { randomBytes } from "node:crypto";

const db = new PrismaClient();
const SAR = (n: number) => n * 100;
const hoursAgo = (h: number) => new Date(Date.now() - h * 3600_000);
const token = () => randomBytes(16).toString("base64url");

async function main() {
  // wipe (development only)
  for (const m of ["reminder", "billLine", "bill", "notification", "jobEvent", "photo", "jobCheck", "job", "schedule", "checklistTemplate", "session", "otpCode", "user", "unit", "site", "client", "subcontractor", "lead", "counter"] as const) {
    // @ts-expect-error dynamic model access
    await db[m].deleteMany();
  }

  const now = new Date();
  const client = await db.client.create({
    data: { name: "Yasmin Real Estate", contractStart: new Date(now.getFullYear(), now.getMonth() - 1, 1), contractEnd: new Date(now.getFullYear() + 1, now.getMonth() - 1, 0), monthlyFee: SAR(0) },
  });
  const yasmin = await db.site.create({ data: { name: "Yasmin Compound", city: "Riyadh", clientId: client.id } });
  const rawdah = await db.site.create({ data: { name: "Rawdah Residence", city: "Riyadh", clientId: client.id } });

  const units: Record<string, string> = {};
  for (let i = 1; i <= 12; i++) {
    const u = await db.unit.create({ data: { siteId: yasmin.id, label: `Apt ${i}`, kind: "APARTMENT", monthlyRent: SAR(4000), serviceCharge: SAR(250), ameenFee: SAR(150), dueDay: 1 } });
    units[`Apt ${i}`] = u.id;
  }
  for (let i = 1; i <= 4; i++) {
    const u = await db.unit.create({ data: { siteId: rawdah.id, label: `Villa ${i}`, kind: "VILLA", monthlyRent: SAR(9000), serviceCharge: SAR(500), ameenFee: SAR(250), dueDay: 5 } });
    units[`Villa ${i}`] = u.id;
  }

  const cleanPro = await db.subcontractor.create({ data: { name: "Clean Pro Co.", phone: "+966110000001" } });
  const coolTech = await db.subcontractor.create({ data: { name: "Cool Tech Maintenance", phone: "+966110000002" } });

  const admin = await db.user.create({ data: { name: "Ameen Operations", phone: "+966500000001", role: "ADMIN", locale: "ar" } });
  const owner = await db.user.create({ data: { name: "Abu Fahad", phone: "+966500000002", role: "CLIENT", locale: "ar", clientId: client.id } });
  const sara = await db.user.create({ data: { name: "Sara Al-Otaibi", phone: "+966500000003", role: "TENANT", locale: "ar", unitId: units["Apt 12"] } });
  const imran = await db.user.create({ data: { name: "Imran Khan", phone: "+966500000004", role: "WORKER", locale: "en", subcontractorId: cleanPro.id } });
  const mohammed = await db.user.create({ data: { name: "Mohammed Al-Qahtani", phone: "+966500000005", role: "TENANT", locale: "en", unitId: units["Apt 7"] } });
  const ahmed = await db.user.create({ data: { name: "Ahmed Saleh", phone: "+966500000006", role: "WORKER", locale: "ar", subcontractorId: coolTech.id } });
  await db.user.create({ data: { name: "Noura Al-Harbi", phone: "+966500000007", role: "TENANT", locale: "ar", unitId: units["Villa 2"] } });

  const cleaning = await db.checklistTemplate.create({
    data: {
      name: "Daily cleaning · نظافة يومية",
      jobType: "CLEANING",
      items: JSON.stringify([
        { ar: "تنظيف المدخل والاستقبال", en: "Entrance and lobby cleaned" },
        { ar: "تنظيف الممرات والسلالم", en: "Corridors and stairs cleaned" },
        { ar: "تنظيف المصاعد", en: "Elevators cleaned" },
        { ar: "تفريغ سلال النفايات", en: "Bins emptied" },
      ]),
    },
  });
  const inspection = await db.checklistTemplate.create({
    data: {
      name: "Monthly building inspection · فحص شهري للمبنى",
      jobType: "INSPECTION",
      items: JSON.stringify([
        { ar: "إنارة الممرات والمداخل", en: "Corridor and entrance lighting" },
        { ar: "طفايات الحريق وصلاحيتها", en: "Fire extinguishers in date" },
        { ar: "مخارج الطوارئ غير مسدودة", en: "Emergency exits clear" },
        { ar: "خزانات المياه والمضخات", en: "Water tanks and pumps" },
        { ar: "المصاعد تعمل بشكل سليم", en: "Elevators working" },
      ]),
    },
  });
  const ac = await db.checklistTemplate.create({
    data: {
      name: "AC preventive maintenance · صيانة وقائية للمكيفات",
      jobType: "MAINTENANCE",
      items: JSON.stringify([
        { ar: "تنظيف الفلاتر", en: "Filters cleaned" },
        { ar: "فحص تصريف المياه", en: "Drain line checked" },
        { ar: "قياس درجة التبريد", en: "Cooling temperature measured" },
      ]),
    },
  });

  const r = new Date(Date.now() + 3 * 3600_000);
  const riyadhMidnight = new Date(Date.UTC(r.getUTCFullYear(), r.getUTCMonth(), r.getUTCDate()) - 3 * 3600_000);
  const dailyCleaning = await db.schedule.create({
    data: { siteId: yasmin.id, jobType: "CLEANING", title: "Daily cleaning · نظافة يومية", frequency: "DAILY", timeSlot: "08:00", defaultAssigneeId: imran.id, checklistTemplateId: cleaning.id, lastGeneratedFor: riyadhMidnight },
  });
  await db.schedule.createMany({
    data: [
      { siteId: yasmin.id, jobType: "INSPECTION", title: "Monthly inspection · الفحص الشهري", frequency: "MONTHLY", dayOfMonth: 1, timeSlot: "10:00", defaultAssigneeId: ahmed.id, checklistTemplateId: inspection.id },
      { siteId: rawdah.id, jobType: "MAINTENANCE", title: "AC maintenance · صيانة المكيفات", frequency: "WEEKLY", dayOfWeek: 0, timeSlot: "09:00", defaultAssigneeId: ahmed.id, checklistTemplateId: ac.id },
    ],
  });

  let n = 1000;
  const items = (tplItems: string, results?: (string | null)[]) =>
    (JSON.parse(tplItems) as { ar: string; en: string }[]).map((it, index) => ({ index, labelAr: it.ar, labelEn: it.en, result: results?.[index] ?? null }));

  // 1. New urgent request, overdue (created 5h ago, not started)
  await db.job.create({
    data: {
      number: ++n, type: "REPAIR", title: "تسريب مياه تحت مغسلة المطبخ", description: "الماء يتجمع تحت الخزانة منذ الصباح.", priority: "URGENT", status: "NEW", source: "REQUEST",
      siteId: yasmin.id, unitId: units["Apt 12"], requesterId: sara.id, createdAt: hoursAgo(5),
      events: { create: { action: "CREATED", actorId: sara.id, createdAt: hoursAgo(5) } },
    },
  });
  // 2. New request, fresh
  await db.job.create({
    data: {
      number: ++n, type: "REPAIR", title: "AC in bedroom not cooling", priority: "NORMAL", status: "NEW", source: "REQUEST",
      siteId: yasmin.id, unitId: units["Apt 7"], requesterId: mohammed.id, createdAt: hoursAgo(1),
      events: { create: { action: "CREATED", actorId: mohammed.id, createdAt: hoursAgo(1) } },
    },
  });
  // 3. Today's daily cleaning, scheduled for Imran
  const today8 = new Date(riyadhMidnight.getTime() + 8 * 3600_000);
  await db.job.create({
    data: {
      number: ++n, type: "CLEANING", title: "Daily cleaning · نظافة يومية", status: "SCHEDULED", source: "SCHEDULE",
      siteId: yasmin.id, assigneeId: imran.id, scheduledFor: today8, scheduleId: dailyCleaning.id, checklistTemplateId: cleaning.id,
      checks: { create: items(cleaning.items) },
      events: { create: [{ action: "CREATED" }, { action: "ASSIGNED", actorId: admin.id }] },
    },
  });
  // 4. AC maintenance in progress for Ahmed
  await db.job.create({
    data: {
      number: ++n, type: "MAINTENANCE", title: "AC maintenance · صيانة المكيفات", status: "IN_PROGRESS", source: "SCHEDULE",
      siteId: rawdah.id, assigneeId: ahmed.id, scheduledFor: hoursAgo(2), startedAt: hoursAgo(1.5), checklistTemplateId: ac.id,
      checks: { create: items(ac.items, ["OK", null, null]) },
      events: { create: [{ action: "CREATED" }, { action: "ASSIGNED", actorId: admin.id }, { action: "STARTED", actorId: ahmed.id }] },
    },
  });
  // 5. Inspection waiting for client approval
  await db.job.create({
    data: {
      number: ++n, type: "INSPECTION", title: "Monthly inspection · الفحص الشهري", status: "NEEDS_APPROVAL", source: "SCHEDULE",
      siteId: yasmin.id, assigneeId: ahmed.id, scheduledFor: hoursAgo(26), startedAt: hoursAgo(25), finishedAt: hoursAgo(23), checklistTemplateId: inspection.id,
      workerNote: "كل البنود سليمة عدا إنارة الدور الثاني، تم إنشاء طلب إصلاح.",
      checks: { create: items(inspection.items, ["FAIL", "OK", "OK", "OK", "OK"]) },
      events: { create: [{ action: "CREATED" }, { action: "ASSIGNED", actorId: admin.id }, { action: "STARTED", actorId: ahmed.id }, { action: "FINISHED", actorId: ahmed.id }] },
    },
  });
  // 6. Completed and rated repair
  await db.job.create({
    data: {
      number: ++n, type: "REPAIR", title: "Bathroom light not working", status: "COMPLETED", source: "REQUEST", priority: "NORMAL",
      siteId: yasmin.id, unitId: units["Apt 7"], requesterId: mohammed.id, assigneeId: ahmed.id,
      createdAt: hoursAgo(72), scheduledFor: hoursAgo(70), startedAt: hoursAgo(70), finishedAt: hoursAgo(69), approvedAt: hoursAgo(60), rating: 5, ratingNote: "Quick and tidy, thank you",
      events: { create: [{ action: "CREATED", createdAt: hoursAgo(72) }, { action: "ASSIGNED", createdAt: hoursAgo(71) }, { action: "STARTED", createdAt: hoursAgo(70) }, { action: "FINISHED", createdAt: hoursAgo(69) }, { action: "APPROVED", createdAt: hoursAgo(60) }, { action: "RATED", note: "5/5", createdAt: hoursAgo(59) }] },
    },
  });
  await db.counter.create({ data: { name: "job", value: n } });

  // Bills for this month: Sara's is due (late if past the 1st), Mohammed's is paid, Noura's villa is due on the 5th.
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lines = (rent: number, sc: number, fee: number) => [
    { kind: "RENT", payee: "OWNER", amount: SAR(rent) },
    { kind: "SERVICE_CHARGE", payee: "OWNER", amount: SAR(sc) },
    { kind: "AMEEN_FEE", payee: "AMEEN", amount: SAR(fee) },
  ];
  const due = (day: number) => new Date(Date.UTC(now.getFullYear(), now.getMonth(), day, 9));
  await db.bill.create({ data: { unitId: units["Apt 12"], period, dueDate: due(1), payToken: token(), lines: { create: lines(4000, 250, 150) } } });
  await db.bill.create({
    data: { unitId: units["Apt 7"], period, dueDate: due(1), payToken: token(), status: "PAID", paidAt: due(1), gateway: "MOCK", paidMethod: "MADA", lines: { create: lines(4000, 250, 150) } },
  });
  await db.bill.create({
    data: {
      unitId: units["Villa 2"], period, dueDate: due(5), payToken: token(),
      lines: { create: [...lines(9000, 500, 250), { kind: "REPAIR", payee: "AMEEN", amount: SAR(180), note: "Water heater valve" }] },
    },
  });

  await db.lead.create({ data: { name: "Khalid Al-Dosari", phone: "+966555555555", city: "Riyadh", siteType: "COMPOUND", units: "50_150", services: "CLEANING,MAINTENANCE,COLLECTION", locale: "ar" } });

  console.log("Seeded. Sign in with any of these numbers (code shows on screen in test mode):");
  console.log("  Admin   0500000001\n  Owner   0500000002\n  Tenant  0500000003 (Sara, Apt 12)\n  Worker  0500000004 (Imran, cleaning)\n  Tenant  0500000005 (Mohammed, English)\n  Worker  0500000006 (Ahmed, maintenance)");
  void owner;
}

main().finally(() => db.$disconnect());
