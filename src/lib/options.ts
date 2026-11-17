import "server-only";
import { db } from "./db";

/** Lists used by admin forms. */
export async function adminOptions() {
  const [sites, units, workers, templates, clients, subs] = await Promise.all([
    db.site.findMany({ include: { client: true }, orderBy: { name: "asc" } }),
    db.unit.findMany({ include: { site: true }, orderBy: [{ siteId: "asc" }, { label: "asc" }] }),
    db.user.findMany({ where: { role: "WORKER", active: true }, include: { subcontractor: true }, orderBy: { name: "asc" } }),
    db.checklistTemplate.findMany({ orderBy: { name: "asc" } }),
    db.client.findMany({ orderBy: { name: "asc" } }),
    db.subcontractor.findMany({ orderBy: { name: "asc" } }),
  ]);
  return { sites, units, workers, templates, clients, subs };
}

/** Value for a datetime-local input, in Riyadh time. */
export function riyadhInputValue(d: Date) {
  return new Date(d.getTime() + 3 * 3600_000).toISOString().slice(0, 16);
}
