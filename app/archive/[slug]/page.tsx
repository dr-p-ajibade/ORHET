import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { THEMES, themeBySlug } from "@/lib/themes";
import { Medallion } from "@/components/Medallion";
import { PageHead } from "@/components/PageHead";
import { Results } from "@/components/Results";
import { Share } from "@/components/Share";

type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ topic?: string }> };
export const generateStaticParams = () => THEMES.map((t) => ({ slug: t.slug }));

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const t = themeBySlug((await params).slug);
  return t ? { title: t.title, description: `${t.blurb} Live open research records on ${t.title.toLowerCase()}.` } : {};
}

export default async function ThemePage({ params, searchParams }: P) {
  const t = themeBySlug((await params).slug);
  if (!t) notFound();
  const n = Number((await searchParams).topic) || 0;
  const topic = t.topics[n - 1];
  const q = topic ? topic.q : t.q;
  const idx = THEMES.indexOf(t);
  const prev = THEMES[(idx + THEMES.length - 1) % THEMES.length];
  const next = THEMES[(idx + 1) % THEMES.length];
  const pill = (on: boolean) => `inline-block rounded-full border px-4 py-2 text-sm font-medium ${on ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-clay hover:text-clay"}`;

  return (
    <>
      <PageHead label={`Archive · Theme ${t.letter.toUpperCase()}`} title={t.title} aside={<Medallion slug={t.slug} tone="paper" className="w-36 md:w-52" />}>
        <p>{t.blurb}</p>
      </PageHead>
      <div className="wrap py-10 md:py-14">
        <nav aria-label="Topics in this theme">
          <ul className="flex flex-wrap gap-2">
            <li><Link href={`/archive/${t.slug}`} aria-current={!topic ? "page" : undefined} className={pill(!topic)}>Whole theme</Link></li>
            {t.topics.map((tp, i) => (
              <li key={tp.label}><Link href={`/archive/${t.slug}?topic=${i + 1}`} aria-current={topic === tp ? "page" : undefined} className={pill(topic === tp)}>{tp.label}</Link></li>
            ))}
          </ul>
        </nav>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-ink/15 py-4">
          <p className="text-sm text-muted">Live search: <span className="font-mono text-ink">{q}</span></p>
          <Share title={`${topic ? topic.label : t.title} · ORHET`} />
        </div>
        <div className="mt-10">
          <Suspense fallback={<p className="label text-muted">Loading…</p>}>
            <Results key={q} q={q} hidden={topic ? { topic: String(n) } : {}} />
          </Suspense>
        </div>
        <nav aria-label="Other themes" className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-ink/15 bg-ink/15 sm:grid-cols-2">
          {[["Previous theme", prev], ["Next theme", next]].map(([l, x]) => {
            const th = x as typeof t;
            return (
              <Link key={l as string} href={`/archive/${th.slug}`} className="flex items-center gap-5 bg-paper p-6 hover:bg-bone">
                <Medallion slug={th.slug} className="w-16 shrink-0" />
                <span><span className="label block text-muted">{l as string}</span><span className="mt-1 block font-display text-xl leading-tight">{th.title}</span></span>
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );
}
