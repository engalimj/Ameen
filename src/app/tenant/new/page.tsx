import { requireRole } from "@/lib/auth";
import { getI18n } from "@/i18n";
import { createRequest } from "@/app/actions/tenant";
import { BackLink, PageHeader } from "@/components/PortalShell";
import { SubmitButton } from "@/components/SubmitButton";

const CATEGORIES = ["PLUMBING", "ELECTRICAL", "AC", "CLEANING", "OTHER"] as const;

export default async function NewRequest({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireRole("TENANT");
  const { t } = await getI18n();
  const { error } = await searchParams;
  return (
    <div className="mx-auto max-w-xl">
      <BackLink href="/tenant" label={t("common.back")} />
      <PageHeader title={t("tenant.newRequest")} sub={t("tenant.newRequestSub")} />
      <form action={createRequest} className="card flex flex-col gap-5 p-6">
        <fieldset>
          <legend className="label">{t("request.category")}</legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CATEGORIES.map((c, i) => (
              <label key={c} className="flex min-h-12 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 has-[:checked]:border-2 has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint">
                <input type="radio" name="category" value={c} defaultChecked={i === 0} className="accent-sage-deep" />
                {t(`category.${c}` as never)}
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="title" className="label">{t("request.title")}</label>
          <input id="title" name="title" className="input" required minLength={3} maxLength={120} placeholder={t("request.titlePh")} />
        </div>
        <div>
          <label htmlFor="description" className="label">{t("request.details")} <span className="text-muted">({t("common.optional")})</span></label>
          <textarea id="description" name="description" rows={3} className="input" maxLength={1000} />
        </div>
        <div>
          <label htmlFor="photos" className="label">{t("request.photos")} <span className="text-muted">({t("common.optional")})</span></label>
          <input id="photos" name="photos" type="file" accept="image/*" capture="environment" multiple className="block w-full text-sm file:me-3 file:rounded-xl file:border-0 file:bg-sage-tint file:px-4 file:py-2.5 file:font-semibold file:text-sage-deep" />
        </div>
        <fieldset>
          <legend className="label">{t("job.priority")}</legend>
          <div className="flex gap-2">
            {(["NORMAL", "URGENT"] as const).map((p, i) => (
              <label key={p} className="flex min-h-11 flex-1 cursor-pointer items-center gap-2 rounded-xl border border-line px-3 has-[:checked]:border-2 has-[:checked]:border-sage-deep has-[:checked]:bg-sage-tint">
                <input type="radio" name="priority" value={p} defaultChecked={i === 0} className="accent-sage-deep" />
                {t(`priority.${p}`)}
              </label>
            ))}
          </div>
          <p className="hint">{t("request.urgentHint")}</p>
        </fieldset>
        {error && <p role="alert" className="rounded-xl bg-urgent-bg px-3 py-2 text-sm text-urgent-ink">{t("request.error")}</p>}
        <SubmitButton className="btn-primary btn w-full">{t("request.send")}</SubmitButton>
      </form>
    </div>
  );
}
