import Link from "next/link";
import { THEMES } from "@/lib/themes";
import { ESSAYS, ESSAY_THEMES, readingMinutes } from "@/lib/essays";
import { COURSES } from "@/lib/courses";
import { collectionStats, SOURCES } from "@/lib/sources";
import { fmt, fmtDate } from "@/lib/format";
import { Wheel } from "@/components/Wheel";
import { Medallion } from "@/components/Medallion";
import { SearchBox } from "@/components/SearchBox";
import { Stats } from "@/components/Stats";
import { EssayCover } from "@/components/EssayCover";

export const revalidate = 86400;
const EXAMPLES = ["decolonising the curriculum", "gender based violence university", "student funding South Africa"];

export default async function Home() {
  const { headline } = await collectionStats();
  const today = new Date().toISOString().slice(0, 10);
  const next = COURSES.filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const millions = Math.floor(headline.count / 1_000_000);

  return (
    <>
      <section className="on-ink relative overflow-hidden bg-ink text-paper">
        <div aria-hidden className="lines-wave absolute inset-0 opacity-[0.06]" />
        <div className="wrap relative grid items-center gap-14 py-14 lg:grid-cols-[1.05fr_0.95fr] lg:py-20">
          <div className="min-w-0">
            <p className="label text-ochre">Online Resource for Higher Education Transformation</p>
            <h1 className="display mt-5 text-[2.9rem] sm:text-6xl lg:text-[4.5rem]">
              Open scholarship on transforming universities, <em>in one search.</em>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-paper/75">
              ORHET gathers the world's open research on how universities change, and arranges it around eight transformation themes. Every record is live, free to find and linked to its source.
            </p>
            <div className="mt-8 max-w-xl"><SearchBox id="hero-q" /></div>
            <ul className="mt-5 flex flex-wrap items-center gap-2 text-sm">
              <li className="label mr-1 text-paper/50">Try</li>
              {EXAMPLES.map((e) => (
                <li key={e}><Link href={`/search?q=${encodeURIComponent(e)}`} className="inline-block rounded-full border border-paper/25 px-3 py-1.5 text-paper/85 hover:border-ochre hover:text-ochre">{e}</Link></li>
              ))}
            </ul>
          </div>
          <Wheel>
            <div>
              <p className="font-display text-4xl leading-none sm:text-6xl">{millions}M{headline.live ? "" : "+"}</p>
              <p className="label mt-2 text-paper/60">open records</p>
              <p className="label mt-1 text-ochre">8 themes</p>
            </div>
          </Wheel>
        </div>
        {next && (
          <Link href="/training" className="group relative block bg-clay text-paper">
            <div className="wrap flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="label rounded-full bg-ink/25 px-3 py-1">Next course</span>
                <span className="font-semibold">{next.title}</span>
                <span className="text-paper/85">{fmtDate(next.date)}</span>
              </p>
              <span className="font-semibold"><span className="link-u">See available courses</span> →</span>
            </div>
          </Link>
        )}
      </section>

      <section className="wrap py-20 md:py-28" aria-labelledby="themes-h">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="label text-clay">The archive</p>
            <h2 id="themes-h" className="display mt-4 max-w-2xl text-4xl md:text-6xl">Eight themes, <em>one cycle</em> of change.</h2>
          </div>
          <Link href="/archive" className="btn btn-line">Open the archive →</Link>
        </div>
        <ul className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-ink/15 bg-ink/15 sm:grid-cols-2 lg:grid-cols-4">
          {THEMES.map((t) => (
            <li key={t.slug} data-reveal className="bg-paper">
              <Link href={`/archive/${t.slug}`} className="group flex h-full flex-col p-6 transition-colors hover:bg-bone md:p-7">
                <div className="flex items-start justify-between">
                  <Medallion slug={t.slug} className="w-24 md:w-28" />
                  <span className="label text-muted">{t.letter.toUpperCase()} · {t.topics.length} topics</span>
                </div>
                <h3 className="mt-6 font-display text-[1.35rem] leading-tight">{t.title}</h3>
                <p className="mt-2 text-[0.92rem] text-ink/70">{t.blurb}</p>
                <span className="mt-auto pt-5 text-sm font-semibold text-clay"><span className="link-u">Browse records</span> →</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Stats />

      <section className="bg-bone" aria-labelledby="blog-h">
        <div className="wrap py-20 md:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="label text-clay">From the blog</p>
              <h2 id="blog-h" className="display mt-4 text-4xl md:text-6xl">Essays and <em>argument.</em></h2>
            </div>
            <Link href="/blog" className="btn btn-line">All essays →</Link>
          </div>
          <ul className="mt-12 grid gap-8 md:grid-cols-3">
            {ESSAYS.map((e, i) => (
              <li key={e.id} data-reveal>
                <Link href={`/blog/${e.id}`} className="group block">
                  <EssayCover theme={ESSAY_THEMES[e.id]?.[0] || "institutional-culture"} index={i} className="aspect-[4/3] rounded-2xl" />
                  <p className="label mt-5 text-muted">{e.date} · {readingMinutes(e)} min read</p>
                  <h3 className="mt-2 font-display text-2xl leading-tight"><span className="link-u">{e.title}</span></h3>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="wrap py-20 md:py-28" aria-labelledby="how-h">
        <p className="label text-clay">How it works</p>
        <h2 id="how-h" className="display mt-4 max-w-3xl text-4xl md:text-6xl">Nothing here is stored. <em>Everything is sourced.</em></h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {[
            ["Ask once", "Your search goes to every open database at the same moment."],
            ["One clean list", "Duplicate records are merged by DOI and title, so each work appears once with every source that holds it."],
            ["Read it free", "Where a free full text exists, ORHET finds it and links you straight to it."],
          ].map(([h, p], i) => (
            <li key={h} data-reveal className="border-t border-ink pt-5">
              <span className="label text-clay">0{i + 1}</span>
              <h3 className="mt-3 font-display text-2xl">{h}</h3>
              <p className="mt-2 text-ink/75">{p}</p>
            </li>
          ))}
        </ol>
        <ul className="mt-14 flex flex-wrap gap-3">
          {SOURCES.map((s) => (
            <li key={s.id} className="rounded-2xl border border-ink/15 px-4 py-3">
              <a href={s.url} rel="noopener" className="font-semibold hover:text-clay">{s.name}</a>
              <span className="block text-sm text-muted">{s.note}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">Today {fmt(headline.count)}{headline.live ? "" : "+"} works are indexed in {headline.name} alone.</p>
      </section>
    </>
  );
}
