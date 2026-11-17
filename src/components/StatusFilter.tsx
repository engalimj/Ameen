import Link from "next/link";
import type { T } from "@/i18n";
import { JOB_STATUSES } from "@/lib/constants";

export function StatusFilter({ base, current, t }: { base: string; current?: string; t: T }) {
  const items = [undefined, ...JOB_STATUSES];
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
      {items.map((s) => (
        <Link
          key={s ?? "all"}
          href={s ? `${base}?status=${s}` : base}
          className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm ${current === s ? "bg-sage-deep text-white" : "bg-white text-slate"}`}
        >
          {s ? t(`status.${s}` as never) : t("common.all")}
        </Link>
      ))}
    </div>
  );
}
