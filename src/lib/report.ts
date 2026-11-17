import "server-only";
import { db } from "./db";
import { isOverdue } from "./constants";

export function monthRange(period: string) {
  const [y, m] = period.split("-").map(Number);
  return { from: new Date(y, m - 1, 1), to: new Date(y, m, 1) };
}

/** Numbers for the client's monthly report and dashboard. */
export async function clientMonthStats(clientId: string, period: string) {
  const { from, to } = monthRange(period);
  const jobs = await db.job.findMany({
    where: { site: { clientId }, createdAt: { gte: from, lt: to } },
    include: { site: true, checks: true },
  });
  const completed = jobs.filter((j) => j.status === "COMPLETED");
  const requests = jobs.filter((j) => j.source === "REQUEST");
  const responseHours = requests
    .filter((j) => j.startedAt)
    .map((j) => (j.startedAt!.getTime() - j.createdAt.getTime()) / 3600_000);
  const startedLate = requests.filter((j) => j.startedAt && (j.startedAt.getTime() - j.createdAt.getTime()) / 3600_000 > 4).length;
  const inspections = completed.filter((j) => j.type === "INSPECTION");
  const scored = inspections.flatMap((j) => j.checks.filter((c) => c.result === "OK" || c.result === "FAIL"));
  const ratings = jobs.filter((j) => j.rating).map((j) => j.rating!);
  const bySite = new Map<string, { name: string; total: number; done: number }>();
  for (const j of jobs) {
    const s = bySite.get(j.siteId) ?? { name: j.site.name, total: 0, done: 0 };
    s.total++;
    if (j.status === "COMPLETED") s.done++;
    bySite.set(j.siteId, s);
  }
  const byType = new Map<string, number>();
  for (const j of completed) byType.set(j.type, (byType.get(j.type) ?? 0) + 1);
  return {
    total: jobs.length,
    completed: completed.length,
    requests: requests.length,
    avgResponseH: responseHours.length ? responseHours.reduce((a, b) => a + b, 0) / responseHours.length : null,
    onTimePct: requests.filter((j) => j.startedAt).length
      ? Math.round((1 - startedLate / requests.filter((j) => j.startedAt).length) * 100)
      : null,
    overdueNow: jobs.filter((j) => isOverdue(j)).length,
    inspectionScore: scored.length ? Math.round((scored.filter((c) => c.result === "OK").length / scored.length) * 100) : null,
    avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
    bySite: [...bySite.values()],
    byType: [...byType.entries()],
  };
}
