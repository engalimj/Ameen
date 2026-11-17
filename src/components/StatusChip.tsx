import type { T } from "@/i18n";

// Always text plus an icon, never color alone (brand guideline).
const STYLE: Record<string, { cls: string; icon: string }> = {
  NEW: { cls: "bg-mist-tint text-info-ink", icon: "●" },
  SCHEDULED: { cls: "bg-mist-tint text-info-ink", icon: "◷" },
  IN_PROGRESS: { cls: "bg-wait-bg text-wait-ink", icon: "↻" },
  NEEDS_APPROVAL: { cls: "bg-wait-bg text-wait-ink", icon: "!" },
  COMPLETED: { cls: "bg-done-bg text-done-ink", icon: "✓" },
  OVERDUE: { cls: "bg-urgent-bg text-urgent-ink", icon: "⏱" },
  URGENT: { cls: "bg-urgent-bg text-urgent-ink", icon: "▲" },
  DUE: { cls: "bg-wait-bg text-wait-ink", icon: "◷" },
  LATE: { cls: "bg-urgent-bg text-urgent-ink", icon: "!" },
  PAID: { cls: "bg-done-bg text-done-ink", icon: "✓" },
};

export function Chip({ kind, label }: { kind: keyof typeof STYLE | string; label: string }) {
  const s = STYLE[kind] ?? STYLE.NEW;
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1 text-[13px] font-medium ${s.cls}`}>
      <span aria-hidden="true">{s.icon}</span>
      {label}
    </span>
  );
}

export function StatusChip({ status, t }: { status: string; t: T }) {
  return <Chip kind={status} label={t(`status.${status}` as never)} />;
}
