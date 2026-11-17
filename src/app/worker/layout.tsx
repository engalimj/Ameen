import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { PortalShell } from "@/components/PortalShell";

export default async function WorkerLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("WORKER");
  const { t } = await getI18n();
  return (
    <PortalShell user={user} portalLabel={t("portal.WORKER")} nav={[{ href: "/worker", label: t("worker.today"), icon: "jobs" }]}>
      {children}
    </PortalShell>
  );
}
