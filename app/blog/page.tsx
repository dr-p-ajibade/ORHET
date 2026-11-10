import type { Metadata } from "next";
import Link from "next/link";
import { ESSAYS, ESSAY_THEMES, readingMinutes } from "@/lib/essays";
import { THEMES, themeBySlug } from "@/lib/themes";
import { COURSES } from "@/lib/courses";
import { fmtDate } from "@/lib/format";
import { EssayCover } from "@/components/EssayCover";
import { Medallion } from "@/components/Medallion";
import { PageHead } from "@/components/PageHead";

export const metadata: Metadata = { title: "Blog", description: "Scholarly essays and commentary on higher education transformation, open science and epistemic justice." };
type P = { searchParams: Promise<{ theme?: string }> };

export default async function Blog({ searchParams }: P) {
  const active = themeBySlug((await searchParams).theme || "");
  const list = ESSAYS.filter((e) => e.status === "published" && (!active || ESSAY_THEMES[e.id]?.includes(active.slug)));
  const today = new Date().toISOString().slice(0, 10);
  const course = COURSES.filter((c) => c.date >= today)[0];
  const count = (slug: string) => ESSAYS.filter((e) => ESSAY_THEMES[e.id]?.includes(slug)).length;

  return (
    <>
      <PageHead label="Blog" title={<>Essays and <em>argument</em> on the changing university.</>}>
        <p>Critical essays, policy analysis and open scholarship commentary. Written to be read, shared and argued with.</p>
      </PageHead>
      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1fr_18rem] md:py-20">
        <div>
          {active && (
            <p className="mb-8 flex flex-wrap items-center gap-3">
              <span className="label text-muted">Showing</span>
              <span className="rounded-full bg-ink px-4 py-1.5 text-sm text-paper">{active.title}</span>
              <Link href="/blog" className="text-sm font-semibold text-clay hover:underline">Show all essays</Link>
            </p>
          )}
          {list.length === 0 && <p className="rounded-2xl border border-ink/15 p-8 font-display text-2xl">No essays on this theme yet.</p>}
          <ul className="space-y-14">
            {list.map((e, i) => (
              <li key={e.id} data-reveal>
                <article className="grid gap-6 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-10">
                  <Link href={`/blog/${e.id}`} tabIndex={-1} aria-hidden><EssayCover theme={ESSAY_THEMES[e.id]?.[0] || "institutional-culture"} index={ESSAYS.indexOf(e)} className="aspect-[4/3] rounded-2xl" /></Link>
                  <div>
                    <p className="label text-muted">{e.date} · {readingMinutes(e)} min read</p>
                    <h2 className="mt-3 font-display text-[1.7rem] leading-tight md:text-4xl"><Link href={`/blog/${e.id}`} className="link-u">{e.title}</Link></h2>
                    <p className="mt-4 text-ink/75">{e.excerpt}</p>
                    <p className="mt-4 text-sm">By <span className="font-semibold">{e.author}</span></p>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {(ESSAY_THEMES[e.id] || []).map((s) => <li key={s}><Link href={`/blog?theme=${s}`} className="rounded-full border border-ink/20 px-3 py-1 text-[0.8rem] hover:border-clay hover:text-clay">{themeBySlug(s)?.short}</Link></li>)}
                    </ul>
                    <Link href={`/blog/${e.id}`} className="mt-6 inline-block font-semibold text-clay"><span className="link-u">Read the essay</span> →</Link>
                  </div>
                </article>
                {i < list.length - 1 && <div aria-hidden className="lines-arc-ink mt-14 h-[18px] opacity-15" style={{ backgroundSize: "36px 18px" }} />}
              </li>
            ))}
          </ul>
        </div>
        <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
          <nav aria-label="Essays by theme">
            <h2 className="label text-muted">Essays by theme</h2>
            <ul className="mt-4">
              {THEMES.map((t) => (
                <li key={t.slug} className="border-t border-ink/15">
                  <Link href={`/blog?theme=${t.slug}`} aria-current={active?.slug === t.slug ? "page" : undefined} className={`flex items-center gap-3 py-2.5 text-[0.92rem] hover:text-clay ${active?.slug === t.slug ? "font-semibold text-clay" : ""}`}>
                    <Medallion slug={t.slug} className="w-8 shrink-0" />
                    <span className="flex-1 leading-tight">{t.title.split(",")[0]}</span>
                    <span className="label text-muted">{count(t.slug)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {course && (
            <Link href="/training" className="on-ink block rounded-2xl bg-ink p-6 text-paper hover:bg-ink-3">
              <p className="label text-ochre">Available course</p>
              <p className="mt-3 font-display text-xl leading-tight">{course.title}</p>
              <p className="mt-2 text-sm text-paper/70">{fmtDate(course.date)}</p>
              <p className="mt-4 text-sm font-semibold">See all courses →</p>
            </Link>
          )}
        </aside>
      </div>
    </>
  );
}
