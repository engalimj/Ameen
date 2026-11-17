import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PORTAL_PATH, type Role } from "@/lib/constants";
import { markNotificationsRead } from "@/app/actions/session";
import { BackLink, Empty, PageHeader } from "@/components/PortalShell";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { t, fmtDateTime } = await getI18n();
  const items = await db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 50 });
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <BackLink href={PORTAL_PATH[user.role as Role]} label={t("common.back")} />
      <PageHeader
        title={t("nav.notifications")}
        action={
          items.some((n) => !n.readAt) ? (
            <form action={markNotificationsRead}>
              <button className="btn-secondary btn">{t("notifications.markRead")}</button>
            </form>
          ) : null
        }
      />
      {items.length === 0 ? (
        <Empty text={t("notifications.empty")} />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id} className={`card ${n.readAt ? "" : "border-s-4 border-sage-deep"}`}>
              <div className="flex justify-between gap-3">
                <p className="font-semibold">{n.title}</p>
                <time className="shrink-0 text-xs text-muted">{fmtDateTime(n.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-line text-sm text-muted">{n.body}</p>
              {n.link && (
                <Link href={n.link} className="mt-2 inline-block text-sm font-medium text-sage-deep">
                  {t("common.open")}
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
