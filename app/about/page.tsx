import type { Metadata } from "next";
import Link from "next/link";
import { SOURCES } from "@/lib/sources";
import { THEMES } from "@/lib/themes";
import { SITE } from "@/lib/site";
import { Medallion } from "@/components/Medallion";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "About", description: "What ORHET is, where its records come from and how the federated search works." };

export default function About() {
  return (
    <>
      <PageHead label="About" title={<>A commons for the work of <em>changing universities.</em></>}>
        <p>{SITE.full} is a free gateway to open research on higher education transformation, with a focus on South Africa and the wider continent.</p>
      </PageHead>
      <div className="wrap grid gap-14 py-14 md:grid-cols-12 md:py-20">
        <div className="space-y-12 md:col-span-7">
          <section>
            <h2 className="display text-3xl md:text-4xl">What ORHET does</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">Research on university transformation is scattered across thousands of journals, repositories and preprint servers. ORHET asks all the major open databases at once, merges what comes back and arranges it around eight transformation themes.</p>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">The themes follow the ORHET proposal, after the 2015 Transformation Barometer (Keet and Swartz), with two areas added in 2020.</p>
          </section>
          <section>
            <h2 className="display text-3xl md:text-4xl">How the search works</h2>
            <ul className="mt-5 space-y-4 text-lg text-ink/80">
              {["Records are fetched live each time you search. ORHET holds no articles of its own.",
                "Duplicates are merged by DOI and title, and every record links back to its source.",
                "Free full text links come from the databases themselves or from Unpaywall.",
                "Each search waits only a few seconds. A database that is slow at that moment is left out of that search, and the results page names the ones that answered.",
                "Coverage and metadata quality depend on each database. If a record looks wrong, follow its DOI to the publisher."].map((x) => (
                <li key={x} className="flex gap-4"><span aria-hidden className="mt-3 h-px w-6 shrink-0 bg-clay" />{x}</li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="display text-3xl md:text-4xl">What ORHET writes</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">Only the <Link href="/blog" className="font-semibold text-clay hover:underline">blog essays</Link> and <Link href="/training" className="font-semibold text-clay hover:underline">course descriptions</Link> are written by ORHET. Nothing in the archive is written or edited by us.</p>
          </section>
          <section>
            <h2 className="display text-3xl md:text-4xl">Accessibility</h2>
            <p className="mt-4 text-lg leading-relaxed text-ink/80">The site works with a keyboard and with screen readers, which can read every page aloud. Animation switches off when your device asks for reduced motion. If something gets in your way, please tell us.</p>
          </section>
          <section className="on-ink rounded-3xl bg-ink p-8 text-paper">
            <h2 className="font-display text-2xl">Contact</h2>
            <p className="mt-2 text-paper/75">Questions, corrections and partnership enquiries are welcome.</p>
            <a href={`mailto:${SITE.email}`} className="btn btn-clay mt-5">{SITE.email}</a>
          </section>
        </div>
        <aside className="md:col-span-4 md:col-start-9">
          <h2 className="label text-muted">Sources</h2>
          <ul className="mt-4">
            {[...SOURCES, { id: "unpaywall", name: "Unpaywall", note: "Free full text by DOI", url: "https://unpaywall.org" }].map((s) => (
              <li key={s.id} className="border-t border-ink/15 py-3.5"><a href={s.url} rel="noopener" className="font-semibold hover:text-clay">{s.name} ↗</a><span className="block text-sm text-muted">{s.note}{s.id === "core" || s.id === "semanticscholar" ? ". Needs a free access key to be set." : ""}</span></li>
            ))}
          </ul>
          <h2 className="label mt-12 text-muted">The eight themes</h2>
          <ul className="mt-4 grid grid-cols-4 gap-3">
            {THEMES.map((t) => <li key={t.slug}><Link href={`/archive/${t.slug}`} aria-label={t.title} title={t.title}><Medallion slug={t.slug} className="w-full" /></Link></li>)}
          </ul>
        </aside>
      </div>
    </>
  );
}
