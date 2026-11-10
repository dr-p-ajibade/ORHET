import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ESSAYS, ESSAY_THEMES, essayBySlug, readingMinutes } from "@/lib/essays";
import { themeBySlug } from "@/lib/themes";
import { COURSES } from "@/lib/courses";
import { fmtDate } from "@/lib/format";
import { EssayCover } from "@/components/EssayCover";
import { Medallion } from "@/components/Medallion";
import { Share } from "@/components/Share";

type P = { params: Promise<{ slug: string }> };
export const generateStaticParams = () => ESSAYS.map((e) => ({ slug: e.id }));
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const e = essayBySlug((await params).slug);
  return e ? { title: e.title, description: e.excerpt, openGraph: { type: "article", title: e.title, description: e.excerpt } } : {};
}

type Block = { kind: "h2" | "p" | "ul"; text?: string; items?: string[] };
function parse(content: string): { body: Block[]; refs: string[] } {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const body: Block[] = [];
  const refs: string[] = [];
  let inRefs = false;
  for (const l of lines) {
    if (/^References$/i.test(l)) { inRefs = true; continue; }
    if (inRefs) { refs.push(l); continue; }
    if (/^(Abstract|Introduction|Conclusion)$/i.test(l) || (/^\d+\.\s/.test(l) && l.length < 120)) body.push({ kind: "h2", text: l.replace(/^\d+\.\s/, "") });
    else if (l.startsWith("- ")) {
      const last = body[body.length - 1];
      if (last?.kind === "ul") last.items!.push(l.slice(2)); else body.push({ kind: "ul", items: [l.slice(2)] });
    } else body.push({ kind: "p", text: l });
  }
  return { body, refs };
}

export default async function EssayPage({ params }: P) {
  const e = essayBySlug((await params).slug);
  if (!e) notFound();
  const idx = ESSAYS.indexOf(e);
  const next = ESSAYS[(idx + 1) % ESSAYS.length];
  const themes = (ESSAY_THEMES[e.id] || []).map(themeBySlug).filter(Boolean) as NonNullable<ReturnType<typeof themeBySlug>>[];
  const { body, refs } = parse(e.content);
  const today = new Date().toISOString().slice(0, 10);
  const course = COURSES.filter((c) => c.date >= today)[0];

  return (
    <article>
      <header className="on-ink relative overflow-hidden bg-ink text-paper">
        <div aria-hidden className="absolute inset-0 opacity-50"><EssayCover theme={themes[0]?.slug || "institutional-culture"} index={idx} className="h-full w-full" /></div>
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/85 to-ink/20" />
        <div className="wrap relative py-16 md:py-24">
          <p className="label"><Link href="/blog" className="text-ochre hover:underline">← Blog</Link></p>
          <h1 className="display mt-6 max-w-4xl text-[2.1rem] sm:text-5xl md:text-6xl">{e.title}</h1>
          <p className="label mt-8 flex flex-wrap gap-x-4 gap-y-1 text-paper/70"><span>{e.author}</span><span>{e.date}</span><span>{readingMinutes(e)} min read</span></p>
        </div>
        <div aria-hidden className="band lines-arc relative opacity-30" />
      </header>

      <div className="wrap grid gap-14 py-14 lg:grid-cols-[1fr_18rem] md:py-20">
        <div className="max-w-[44rem]">
          <p className="font-display text-2xl leading-snug text-ink/85">{e.excerpt}</p>
          <div className="prose-essay mt-10">
            {body.map((b, i) => b.kind === "h2" ? <h2 key={i}>{b.text}</h2> : b.kind === "ul" ? <ul key={i}>{b.items!.map((x, n) => <li key={n}>{x}</li>)}</ul> : <p key={i}>{b.text}</p>)}
            {refs.length > 0 && <section className="refs" aria-labelledby="refs-h"><h2 id="refs-h">References</h2>{refs.map((r, i) => <p key={i}>{r}</p>)}</section>}
          </div>
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-ink/15 py-5">
            <Share title={e.title} />
            <a href="#top" className="text-sm font-semibold text-clay hover:underline">Back to top ↑</a>
          </div>
          <Link href={`/blog/${next.id}`} className="on-ink group mt-10 block rounded-3xl bg-ink p-8 text-paper hover:bg-ink-3">
            <span className="label text-ochre">Next essay</span>
            <span className="mt-3 block font-display text-2xl leading-tight md:text-3xl">{next.title} →</span>
          </Link>
        </div>
        <aside className="space-y-10 lg:sticky lg:top-28 lg:self-start">
          {themes.length > 0 && (
            <nav aria-label="Related archive themes">
              <h2 className="label text-muted">Read the research</h2>
              <ul className="mt-4">
                {themes.map((t) => (
                  <li key={t.slug} className="border-t border-ink/15"><Link href={`/archive/${t.slug}`} className="flex items-center gap-3 py-3 hover:text-clay"><Medallion slug={t.slug} className="w-11 shrink-0" /><span className="text-[0.92rem] leading-tight">{t.title}</span></Link></li>
                ))}
              </ul>
            </nav>
          )}
          {course && (
            <Link href="/training" className="block rounded-2xl bg-clay p-6 text-paper hover:bg-clay-deep">
              <p className="label">Available course</p>
              <p className="mt-3 font-display text-xl leading-tight">{course.title}</p>
              <p className="mt-2 text-sm text-paper/85">{fmtDate(course.date)}</p>
              <p className="mt-4 text-sm font-semibold">See all courses →</p>
            </Link>
          )}
        </aside>
      </div>
    </article>
  );
}
