import Link from "next/link";
import { db } from "@/lib/db";
import { getI18n } from "@/i18n";
import { signOutAction, stopViewAsAction } from "@/app/actions/session";
import { getViewAs } from "@/lib/auth";
import { LangSwitch } from "./LangSwitch";
import { Icon, type IconName } from "./Icon";

export type NavItem = { href: string; label: string; icon: IconName };

export async function PortalShell({
  user,
  nav,
  portalLabel,
  children,
}: {
  user: { id: string; name: string };
  nav: NavItem[];
  portalLabel: string;
  children: React.ReactNode;
}) {
  const { t, locale } = await getI18n();
  const unread = await db.notification.count({ where: { userId: user.id, readAt: null } });
  const viewAs = await getViewAs();
  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      {viewAs && (
        <div className="no-print sticky top-0 z-30 flex flex-wrap items-center justify-center gap-3 bg-slate px-4 py-2 text-sm text-white">
          <span>
            {t("viewAs.banner", { name: viewAs.user.name, role: t(`portal.${viewAs.user.role}` as never) })}
          </span>
          <form action={stopViewAsAction}>
            <button className="rounded-lg bg-white px-3 py-1 font-semibold text-slate">{t("viewAs.back")}</button>
          </form>
        </div>
      )}
      <header className={`no-print sticky ${viewAs ? "top-9" : "top-0"} z-20 border-b border-sand bg-ivory/95 backdrop-blur`}>
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <Link href={nav[0].href} className="flex items-center gap-2.5" aria-label={t("brand.name")}>
            <img src="/brand/ameen-mark-primary.svg" alt="" width={34} height={34} />
            <span className="text-lg font-bold">{t("brand.name")}</span>
            <span className="hidden whitespace-nowrap rounded-full bg-sage-tint px-2.5 py-0.5 text-xs font-medium text-sage-deep sm:inline">{portalLabel}</span>
          </Link>
          <nav className="ms-3 hidden gap-0 lg:flex" aria-label={t("nav.main")}>
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="btn-quiet btn min-h-9 gap-1.5 whitespace-nowrap px-2 text-sm font-medium text-slate">
                <Icon name={n.icon} size={18} className={nav.length > 5 ? "hidden xl:block" : ""} />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="ms-auto flex items-center gap-1">
            <Link href="/notifications" className="btn-quiet btn relative min-h-9 px-2.5" aria-label={t("nav.notifications")}>
              <Icon name="bell" />
              {unread > 0 && (
                <span className="absolute -top-0.5 end-0.5 min-w-5 rounded-full bg-sage-deep px-1 text-center text-[11px] leading-5 text-white">
                  {unread}
                </span>
              )}
            </Link>
            <LangSwitch current={locale} />
            <form action={signOutAction}>
              <button className="btn-quiet btn min-h-9 px-2.5" aria-label={t("nav.signOut")} title={t("nav.signOut")}>
                <Icon name="out" className="flip-rtl" />
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <nav
        className="no-print fixed inset-x-0 bottom-0 z-20 flex border-t border-sand bg-white md:hidden"
        aria-label={t("nav.main")}
      >
        {nav.slice(0, 5).map((n) => (
          <Link key={n.href} href={n.href} className="flex flex-1 flex-col items-center gap-0.5 py-2 text-[12px] text-muted">
            <Icon name={n.icon} size={22} className="text-sage-deep" />
            {n.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export function PageHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="h1">{title}</h1>
        {sub && <p className="mt-1 text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="no-print mb-3 inline-flex items-center gap-1 text-sm text-sage-deep">
      <Icon name="back" size={18} />
      {label}
    </Link>
  );
}

export function Empty({ text }: { text: string }) {
  return <p className="card text-center text-muted">{text}</p>;
}

export function Stat({ label, value, tone = "plain" }: { label: string; value: string | number; tone?: "plain" | "warn" | "good" }) {
  const toneCls = tone === "warn" ? "text-urgent-ink" : tone === "good" ? "text-done-ink" : "text-slate";
  return (
    <div className="card">
      <p className="text-sm text-muted">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${toneCls}`}>{value}</p>
    </div>
  );
}
