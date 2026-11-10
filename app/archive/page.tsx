import type { Metadata } from "next";
import Link from "next/link";
import { THEMES } from "@/lib/themes";
import { themeCount } from "@/lib/sources";
import { fmt } from "@/lib/format";
import { Medallion } from "@/components/Medallion";
import { PageHead } from "@/components/PageHead";
import { SearchBox } from "@/components/SearchBox";
import { Stats } from "@/components/Stats";

export const revalidate = 86400;
export const metadata: Metadata = { title: "Archive", description: "Browse open research on higher education transformation by eight themes, each opening live records from the world's open scholarly databases." };

export default async function Archive() {
  const counts = await Promise.all(THEMES.map((t) => themeCount(t.q)));
  return (
    <>
      <PageHead label="Archive" title={<>The record, arranged by <em>eight themes.</em></>}>
        <p>The thematic areas follow the ORHET proposal, after the 2015 Transformation Barometer (Keet and Swartz), with the 2020 additions. Each theme and topic opens a live search.</p>
        <div className="mt-8 max-w-xl"><SearchBox id="archive-q" /></div>
      </PageHead>

      <nav aria-label="Themes" className="sticky top-[calc(4.5rem+9px)] z-30 border-b border-ink/15 bg-paper/95 backdrop-blur">
        <ul className="wrap flex gap-1 overflow-x-auto py-2.5">
          {THEMES.map((t) => (
            <li key={t.slug} className="shrink-0">
              <a href={`#${t.slug}`} className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3.5 text-sm font-medium hover:bg-bone">
                <Medallion slug={t.slug} className="w-8" />{t.short}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="wrap py-8 md:py-14">
        {THEMES.map((t, i) => (
          <section key={t.slug} id={t.slug} aria-labelledby={`${t.slug}-h`} className="grid gap-8 border-b border-ink/15 py-12 md:grid-cols-[14rem_1fr] md:gap-14 md:py-16">
            <Link href={`/archive/${t.slug}`} aria-label={`Open ${t.title}`} className="block w-36 md:w-full" data-reveal>
              <Medallion slug={t.slug} tone={i % 2 ? "clay" : "ink"} className="w-full" />
            </Link>
            <div data-reveal>
              <p className="label text-muted">Theme {t.letter.toUpperCase()}{counts[i] ? ` · about ${fmt(counts[i]!)} records in OpenAlex` : ""}</p>
              <h2 id={`${t.slug}-h`} className="display mt-3 text-3xl md:text-5xl"><Link href={`/archive/${t.slug}`} className="link-u">{t.title}</Link></h2>
              <p className="mt-4 max-w-2xl text-lg text-ink/75">{t.blurb}</p>
              <ul className="mt-7 grid gap-x-10 sm:grid-cols-2">
                {t.topics.map((tp, n) => (
                  <li key={tp.label} className="border-t border-ink/15">
                    <Link href={`/archive/${t.slug}?topic=${n + 1}`} className="group flex items-center justify-between gap-4 py-3.5 hover:text-clay">
                      <span>{tp.label}</span><span aria-hidden className="text-clay transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ))}
      </div>
      <Stats />
    </>
  );
}
