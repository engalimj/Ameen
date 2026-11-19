import Link from "next/link";
import type { Dict } from "@/i18n";

/** Legal links only (playbook point 10). No social or navigation links, so nothing pulls focus. */
export function LegalFooter({ L, legal }: { L: Dict["landing"]; legal: Dict["legal"] }) {
  return (
    <footer className="border-t border-sand py-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 text-sm text-muted">
        <span>{L.footerRights}</span>
        <nav className="flex gap-4" aria-label={legal.privacy.title + " · " + legal.terms.title}>
          <Link href="/privacy" className="hover:text-sage-deep">{legal.privacy.title}</Link>
          <Link href="/terms" className="hover:text-sage-deep">{legal.terms.title}</Link>
        </nav>
      </div>
    </footer>
  );
}
