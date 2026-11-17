import Link from "next/link";
import type { Job, Site, Unit, User } from "@prisma/client";
import type { T } from "@/i18n";
import { isOverdue } from "@/lib/constants";
import { quickAssignAction } from "@/app/actions/admin";
import { riyadhInputValue, workerLabel } from "@/lib/options";
import { Chip, StatusChip } from "./StatusChip";
import { SubmitButton } from "./SubmitButton";

type Worker = User & { subcontractor: { name: string } | null; _open?: number };

/** A job card with an inline "assign to" picker, so the team can assign without opening the job. */
export function QuickAssignList({
  jobs,
  workers,
  load,
  t,
  fmt,
  back,
  empty,
}: {
  jobs: (Job & { site: Site; unit: Unit | null })[];
  workers: Worker[];
  load: Record<string, number>;
  t: T;
  fmt: (d: Date) => string;
  back: string;
  empty: string;
}) {
  if (!jobs.length) return <p className="card text-center text-muted">{empty}</p>;
  const nextHour = riyadhInputValue(new Date(Math.ceil(Date.now() / 3600_000) * 3600_000));
  return (
    <ul className="flex flex-col gap-2">
      {jobs.map((job) => (
        <li key={job.id} className="card flex flex-col gap-3 lg:flex-row lg:items-center">
          <Link href={`/admin/jobs/${job.id}`} className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted" dir="ltr">#{job.number}</span>
              <span className="text-xs text-muted">{t(`type.${job.type}` as never)}</span>
              {job.priority === "URGENT" && <Chip kind="URGENT" label={t("priority.URGENT")} />}
              {isOverdue(job) && <Chip kind="OVERDUE" label={t("status.OVERDUE")} />}
              <StatusChip status={job.status} t={t} />
            </div>
            <p className="mt-1 truncate font-semibold">{job.title}</p>
            <p className="text-sm text-muted">
              {job.site.name}{job.unit ? ` · ${job.unit.label}` : ""} · <bdi>{fmt(job.createdAt)}</bdi>
            </p>
          </Link>
          <form action={quickAssignAction} className="flex flex-wrap items-center gap-2 lg:w-[460px] lg:flex-nowrap">
            <input type="hidden" name="jobId" value={job.id} />
            <input type="hidden" name="back" value={back} />
            <select name="assigneeId" required defaultValue="" className="input min-h-10 flex-1 text-sm" aria-label={t("job.assignee")}>
              <option value="" disabled>{t("admin.pickWorker")}</option>
              {workers.map((w) => (
                <option key={w.id} value={w.id}>
                  {workerLabel(w)} ({t("workers.openShort", { count: load[w.id] ?? 0 })})
                </option>
              ))}
            </select>
            <input name="scheduledFor" type="datetime-local" defaultValue={nextHour} className="input min-h-10 w-auto text-sm" aria-label={t("job.scheduledFor")} />
            <SubmitButton className="btn-primary btn min-h-10 text-sm">{t("admin.assignShort")}</SubmitButton>
          </form>
        </li>
      ))}
    </ul>
  );
}
