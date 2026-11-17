import "server-only";
import { db } from "./db";

/** Open jobs per worker, used to pick who is free. */
export async function openJobsByWorker() {
  const rows = await db.job.groupBy({
    by: ["assigneeId"],
    where: { assigneeId: { not: null }, status: { in: ["NEW", "SCHEDULED", "IN_PROGRESS"] } },
    _count: true,
  });
  return Object.fromEntries(rows.map((r) => [r.assigneeId!, r._count])) as Record<string, number>;
}
