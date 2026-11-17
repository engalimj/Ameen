import Link from "next/link";
import type { Job, JobCheck, Photo, JobEvent, Site, Unit, User } from "@prisma/client";
import type { T } from "@/i18n";
import { isOverdue } from "@/lib/constants";
import { Chip, StatusChip } from "./StatusChip";
import { Icon } from "./Icon";

type ListJob = Job & { site: Site; unit: Unit | null; assignee?: User | null };

export function JobRow({ job, href, t, when }: { job: ListJob; href: string; t: T; when: string }) {
  const overdue = isOverdue(job);
  return (
    <li>
      <Link href={href} className="card flex flex-col gap-2 transition-shadow hover:shadow-[0_2px_12px_rgba(47,59,64,0.08)] sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted" dir="ltr">#{job.number}</span>
            <span className="text-xs text-muted">{t(`type.${job.type}` as never)}</span>
          </div>
          <p className="mt-0.5 truncate font-semibold">{job.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted">
            <Icon name="pin" size={15} />
            {job.site.name}
            {job.unit ? ` · ${job.unit.label}` : ""}
            {job.assignee ? ` · ${job.assignee.name}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end">
          {job.priority === "URGENT" && <Chip kind="URGENT" label={t("priority.URGENT")} />}
          {overdue && <Chip kind="OVERDUE" label={t("status.OVERDUE")} />}
          <StatusChip status={job.status} t={t} />
          <span className="text-xs text-muted">{when}</span>
        </div>
      </Link>
    </li>
  );
}

export function JobList({ jobs, hrefFor, t, fmt, empty }: { jobs: ListJob[]; hrefFor: (j: ListJob) => string; t: T; fmt: (d: Date) => string; empty: string }) {
  if (!jobs.length) return <p className="card text-center text-muted">{empty}</p>;
  return (
    <ul className="flex flex-col gap-2">
      {jobs.map((j) => (
        <JobRow key={j.id} job={j} href={hrefFor(j)} t={t} when={fmt(j.scheduledFor ?? j.createdAt)} />
      ))}
    </ul>
  );
}

type FullJob = Job & {
  site: Site;
  unit: Unit | null;
  requester: User | null;
  assignee: User | null;
  checks: JobCheck[];
  photos: Photo[];
  events: JobEvent[];
};

export function JobSummary({ job, t, fmtDateTime, locale }: { job: FullJob; t: T; fmtDateTime: (d: Date | null) => string; locale: string }) {
  const overdue = isOverdue(job);
  const rows: [string, string][] = [
    [t("job.type"), t(`type.${job.type}` as never)],
    [t("job.place"), `${job.site.name}${job.unit ? ` · ${job.unit.label}` : ""}`],
    [t("job.priority"), t(`priority.${job.priority}` as never)],
    [t("job.requestedBy"), job.requester?.name ?? t(`source.${job.source}` as never)],
    [t("job.assignee"), job.assignee?.name ?? t("job.unassigned")],
    [t("job.scheduledFor"), fmtDateTime(job.scheduledFor) || "—"],
    [t("job.created"), fmtDateTime(job.createdAt)],
  ];
  return (
    <section className="card">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted" dir="ltr">#{job.number}</span>
        <StatusChip status={job.status} t={t} />
        {overdue && <Chip kind="OVERDUE" label={t("status.OVERDUE")} />}
        {job.priority === "URGENT" && <Chip kind="URGENT" label={t("priority.URGENT")} />}
      </div>
      <h1 className="h1 mt-2">{job.title}</h1>
      {job.description && <p className="mt-2 whitespace-pre-line text-muted">{job.description}</p>}
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex justify-between gap-3 border-b border-ivory py-1.5">
            <dt className="text-muted">{k}</dt>
            <dd className="text-end font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      {job.rejectedReason && job.status !== "COMPLETED" && (
        <p className="mt-4 rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent-ink">
          {t("job.rejectedReason")}: {job.rejectedReason}
        </p>
      )}
      {job.workerNote && (
        <p className="mt-4 rounded-xl bg-ivory px-3 py-2 text-sm">
          <strong>{t("job.workerNote")}:</strong> {job.workerNote}
        </p>
      )}
      {job.rating && (
        <p className="mt-4 text-sm">
          <strong>{t("job.rating")}:</strong> {"★".repeat(job.rating)}
          {"☆".repeat(5 - job.rating)} {job.ratingNote}
        </p>
      )}
      <JobChecks checks={job.checks} t={t} locale={locale} />
      <JobPhotos photos={job.photos} t={t} />
    </section>
  );
}

export function JobChecks({ checks, t, locale }: { checks: JobCheck[]; t: T; locale: string }) {
  if (!checks.length) return null;
  const done = checks.filter((c) => c.result).length;
  return (
    <div className="mt-5">
      <h2 className="h2">
        {t("job.checklist")} <span className="text-sm font-normal text-muted">({done}/{checks.length})</span>
      </h2>
      <ul className="mt-2 flex flex-col gap-1.5">
        {checks.map((c) => (
          <li key={c.id} className="flex items-start justify-between gap-3 rounded-xl bg-ivory px-3 py-2 text-sm">
            <span>
              {locale === "ar" ? c.labelAr : c.labelEn}
              {c.note && <span className="block text-muted">{c.note}</span>}
            </span>
            {c.result && <Chip kind={c.result === "OK" ? "COMPLETED" : c.result === "FAIL" ? "LATE" : "NEW"} label={t(`check.${c.result}` as never)} />}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobPhotos({ photos, t }: { photos: Photo[]; t: T }) {
  if (!photos.length) return null;
  const groups = (["REQUEST", "BEFORE", "AFTER"] as const).map((k) => [k, photos.filter((p) => p.kind === k)] as const).filter(([, l]) => l.length);
  return (
    <div className="mt-5 flex flex-col gap-4">
      {groups.map(([kind, list]) => (
        <div key={kind}>
          <h2 className="h2">{t(`photo.${kind}` as never)}</h2>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
            {list.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-xl bg-sand">
                <img src={p.url} alt={t(`photo.${kind}` as never)} className="h-full w-full object-cover" />
              </a>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function JobTimeline({ events, t, fmtDateTime }: { events: JobEvent[]; t: T; fmtDateTime: (d: Date) => string }) {
  return (
    <section className="card">
      <h2 className="h2">{t("job.timeline")}</h2>
      <ol className="mt-3 flex flex-col gap-3 border-s-2 border-sand ps-4">
        {events.map((e) => (
          <li key={e.id} className="text-sm">
            <p className="font-medium">{t(`event.${e.action}` as never)}</p>
            {e.note && <p className="text-muted">{e.note}</p>}
            <time className="text-xs text-muted">{fmtDateTime(e.createdAt)}</time>
          </li>
        ))}
      </ol>
    </section>
  );
}

export const jobInclude = {
  site: true,
  unit: true,
  requester: true,
  assignee: true,
  checks: { orderBy: { index: "asc" } },
  photos: { orderBy: { createdAt: "asc" } },
  events: { orderBy: { createdAt: "asc" } },
} as const;
