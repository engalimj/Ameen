export const ROLES = ["ADMIN", "CLIENT", "TENANT", "WORKER"] as const;
export type Role = (typeof ROLES)[number];

export const JOB_TYPES = ["CLEANING", "INSPECTION", "MAINTENANCE", "REPAIR"] as const;
export type JobType = (typeof JOB_TYPES)[number];

export const JOB_STATUSES = ["NEW", "SCHEDULED", "IN_PROGRESS", "NEEDS_APPROVAL", "COMPLETED"] as const;
export type JobStatus = (typeof JOB_STATUSES)[number];

export const PRIORITIES = ["LOW", "NORMAL", "URGENT"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const FREQUENCIES = ["DAILY", "WEEKLY", "MONTHLY"] as const;

export const LINE_KINDS = ["RENT", "SERVICE_CHARGE", "AMEEN_FEE", "REPAIR"] as const;
export type LineKind = (typeof LINE_KINDS)[number];
export const LINE_PAYEE: Record<LineKind, "OWNER" | "AMEEN"> = {
  RENT: "OWNER",
  SERVICE_CHARGE: "OWNER",
  AMEEN_FEE: "AMEEN",
  REPAIR: "AMEEN",
};

/** Requests not started within this many hours are flagged overdue. */
export const RESPONSE_HOURS = 4;

export const PORTAL_PATH: Record<Role, string> = {
  ADMIN: "/admin",
  CLIENT: "/client",
  TENANT: "/tenant",
  WORKER: "/worker",
};

export function isOverdue(job: { status: string; createdAt: Date; startedAt: Date | null; source: string }, now = new Date()) {
  if (job.source !== "REQUEST") return false;
  if (job.startedAt) return false;
  if (job.status !== "NEW" && job.status !== "SCHEDULED") return false;
  return now.getTime() - job.createdAt.getTime() > RESPONSE_HOURS * 3600_000;
}
