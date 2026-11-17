import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PortalShell } from "@/components/PortalShell";

export default async function ClientLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("CLIENT");
  const { t } = await getI18n();
  return (
    <PortalShell
      user={user}
      portalLabel={t("portal.CLIENT")}
      nav={[
        { href: "/client", label: t("nav.home"), icon: "home" },
        { href: "/client/jobs", label: t("nav.jobs"), icon: "jobs" },
        { href: "/client/report", label: t("nav.report"), icon: "report" },
        { href: "/client/payments", label: t("nav.payments"), icon: "wallet" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
