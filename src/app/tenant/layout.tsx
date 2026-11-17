import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PortalShell } from "@/components/PortalShell";

export default async function TenantLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("TENANT");
  const { t } = await getI18n();
  return (
    <PortalShell
      user={user}
      portalLabel={t("portal.TENANT")}
      nav={[
        { href: "/tenant", label: t("nav.home"), icon: "home" },
        { href: "/tenant/new", label: t("tenant.newRequest"), icon: "plus" },
        { href: "/tenant/payments", label: t("nav.payments"), icon: "wallet" },
      ]}
    >
      {children}
    </PortalShell>
  );
}
