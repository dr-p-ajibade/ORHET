import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { THEMES } from "@/lib/themes";
import { Medallion } from "@/components/Medallion";
import { Results } from "@/components/Results";
import { SearchBox } from "@/components/SearchBox";

type P = { searchParams: Promise<{ q?: string }> };
export async function generateMetadata({ searchParams }: P): Promise<Metadata> {
  const q = ((await searchParams).q || "").trim();
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: P) {
  const q = ((await searchParams).q || "").trim().slice(0, 200);
  return (
    <>
      <header className="on-ink bg-ink text-paper">
        <div className="wrap py-10 md:py-14">
          <p className="label text-ochre">Search the open record</p>
          <h1 className="display mt-3 text-3xl md:text-5xl">{q ? <>Results for <em>{q}</em></> : <>What are you <em>looking for?</em></>}</h1>
          <div className="mt-6 max-w-2xl"><SearchBox defaultValue={q} id="search-q" autoFocus={!q} /></div>
        </div>
        <div aria-hidden className="band lines-arc opacity-30" />
      </header>
      <div className="wrap py-10 md:py-14">
        {q ? (
          <Suspense fallback={<p className="label text-muted">Loading…</p>}><Results key={q} q={q} /></Suspense>
        ) : (
          <div>
            <h2 className="label text-muted">Or start from a theme</h2>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {THEMES.map((t) => (
                <li key={t.slug}><Link href={`/archive/${t.slug}`} className="flex items-center gap-4 rounded-2xl border border-ink/15 p-4 hover:bg-bone"><Medallion slug={t.slug} className="w-14 shrink-0" /><span className="font-display text-lg leading-tight">{t.title}</span></Link></li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
