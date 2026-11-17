import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PortalShell } from "@/components/PortalShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("ADMIN");
  const { t } = await getI18n();
  return (
    <PortalShell
      user={user}
      portalLabel={t("portal.ADMIN")}
      nav={[
        { href: "/admin", label: t("nav.home"), icon: "home" },
        { href: "/admin/jobs", label: t("nav.jobs"), icon: "jobs" },
        { href: "/admin/workers", label: t("nav.workers"), icon: "users" },
        { href: "/admin/payments", label: t("nav.payments"), icon: "wallet" },
        { href: "/admin/screens", label: t("nav.screens"), icon: "eye" },
        { href: "/admin/schedules", label: t("nav.schedules"), icon: "calendar" },
        { href: "/admin/setup", label: t("nav.setup"), icon: "sliders" },
        { href: "/admin/leads", label: t("nav.leads"), icon: "lead" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
