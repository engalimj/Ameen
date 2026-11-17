import Link from "next/link";
import { redirect } from "next/navigation";
import { getI18n, pick } from "@/i18n";
import { getCurrentUser } from "@/lib/auth";
import { PORTAL_PATH, type Role } from "@/lib/constants";
import { LangSwitch } from "@/components/LangSwitch";
import { LoginForm } from "./LoginForm";

export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect(PORTAL_PATH[user.role as Role]);
  const { t, locale } = await getI18n();
  const s = pick(t, [
    "login.phone", "login.phoneHint", "login.send", "login.code", "login.codeHint", "login.verify",
    "login.change", "login.resend", "login.devCode", "login.err.badPhone", "login.err.unknown",
    "login.err.rate", "login.err.badCode",
  ] as const);
  const strip = Object.fromEntries(Object.entries(s).map(([k, v]) => [k.replace("login.", ""), v]));

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
      <div className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/brand/ameen-mark-primary.svg" alt="" width={36} height={36} />
          <span className="text-lg font-bold">{t("brand.name")}</span>
        </Link>
        <LangSwitch current={locale} />
      </div>
      <div className="my-auto py-10">
        <h1 className="h1">{t("login.title")}</h1>
        <p className="mb-6 mt-1 text-muted">{t("login.sub")}</p>
        <div className="card p-6">
          <LoginForm s={strip as never} />
        </div>
        <p className="mt-4 text-center text-sm text-muted">{t("login.noAccount")}</p>
      </div>
    </main>
  );
}
