import Link from "next/link";
import { NAV, SITE } from "@/lib/site";
import { THEMES } from "@/lib/themes";
import { SOURCES } from "@/lib/sources";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="on-ink bg-ink text-paper">
      <div aria-hidden className="band lines-arc opacity-30" />
      <div className="wrap grid gap-12 py-16 md:grid-cols-12">
        <div className="md:col-span-4">
          <Logo />
          <p className="mt-5 max-w-xs text-paper/70">{SITE.full}. Open scholarship on transforming universities, gathered in one place.</p>
          <p className="mt-6"><a className="link-u font-mono text-sm text-ochre" href={`mailto:${SITE.email}`}>{SITE.email}</a></p>
        </div>
        <nav aria-label="Footer" className="md:col-span-2">
          <h2 className="label text-paper/50">Site</h2>
          <ul className="mt-4 space-y-2">
            {NAV.map((n) => <li key={n.href}><Link className="link-u text-paper/85" href={n.href}>{n.label}</Link></li>)}
          </ul>
        </nav>
        <nav aria-label="Themes" className="md:col-span-3">
          <h2 className="label text-paper/50">Archive themes</h2>
          <ul className="mt-4 space-y-2">
            {THEMES.map((t) => <li key={t.slug}><Link className="link-u text-paper/85" href={`/archive/${t.slug}`}>{t.short === "C19" ? "C19 and higher education" : t.title.split(",")[0]}</Link></li>)}
          </ul>
        </nav>
        <div className="md:col-span-3">
          <h2 className="label text-paper/50">Records come live from</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {[...SOURCES, { id: "unpaywall", name: "Unpaywall", url: "https://unpaywall.org" }].map((s) => (
              <li key={s.id}><a className="inline-block rounded-full border border-paper/25 px-3 py-1 text-sm text-paper/80 hover:border-ochre hover:text-ochre" href={s.url} rel="noopener">{s.name}</a></li>
            ))}
          </ul>
          <p className="mt-5 text-sm text-paper/55">ORHET stores no articles. Each record links back to its source and publisher.</p>
        </div>
      </div>
      <div className="wrap flex flex-col gap-3 border-t border-paper/15 py-6 text-sm text-paper/55 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} {SITE.name}. Essays © their authors. Record metadata belongs to the source databases.</p>
        <a href="#top" className="link-u text-paper/85">Back to top ↑</a>
      </div>
    </footer>
  );
}
