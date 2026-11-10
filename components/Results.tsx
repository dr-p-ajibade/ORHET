"use client";
import { usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Rec, SourceReport } from "@/lib/sources";

const NAMES: Record<string, string> = { openalex: "OpenAlex", crossref: "Crossref", europepmc: "Europe PMC", doaj: "DOAJ", semanticscholar: "Semantic Scholar", arxiv: "arXiv", core: "CORE" };
type Data = { results: Rec[]; sources: SourceReport[]; total: number };
const fmt = (n: number) => n.toLocaleString("en-ZA").replace(/ /g, " ");

function cite(r: Rec) {
  const a = r.authors.length > 3 ? `${r.authors[0]} et al.` : r.authors.join(", ");
  const vol = r.volume ? `, ${r.volume}${r.issue ? `(${r.issue})` : ""}` : "";
  return `${a || "Unknown author"} (${r.year || "n.d."}). ${r.title}.${r.journal ? ` ${r.journal}${vol}.` : ""} ${r.url}`;
}

function Card({ r }: { r: Rec }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState("");
  const copy = async (what: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(what); setTimeout(() => setCopied(""), 1600); } catch {} };
  const long = (r.abstract?.length || 0) > 280;
  const chip = "rounded-full border border-ink/20 px-3 py-1 text-[0.8rem] hover:border-clay hover:text-clay";
  return (
    <li className="border-t border-ink/15 py-7">
      <article>
        <p className="label flex flex-wrap gap-x-3 gap-y-1 text-muted">
          {r.year && <span>{r.year}</span>}
          {r.type && <span>{String(r.type).replace(/[-_]/g, " ")}</span>}
          {r.oaUrl && <span className="text-clay">Open access</span>}
          {typeof r.citations === "number" && r.citations > 0 && <span>Cited {fmt(r.citations)}</span>}
        </p>
        <h3 className="mt-2 font-display text-[1.35rem] leading-snug md:text-2xl">
          <a href={r.url} target="_blank" rel="noopener noreferrer" className="link-u">{r.title}</a>
        </h3>
        {r.authors.length > 0 && <p className="mt-2 text-[0.95rem]">{r.authors.slice(0, 6).join(", ")}{r.authors.length > 6 ? " et al." : ""}</p>}
        {r.journal && (
          <p className="mt-1 text-[0.95rem] italic text-muted">
            {r.journal}{r.volume ? `, vol. ${r.volume}` : ""}{r.issue ? `, no. ${r.issue}` : ""}
          </p>
        )}
        {r.abstract && (
          <p className="mt-3 max-w-3xl text-[0.95rem] leading-relaxed text-ink/80">
            {open || !long ? r.abstract : `${r.abstract.slice(0, 280).trimEnd()}…`}{" "}
            {long && <button type="button" className="font-semibold text-clay underline-offset-2 hover:underline" aria-expanded={open} onClick={() => setOpen(!open)}>{open ? "Show less" : "Read more"}</button>}
          </p>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {r.oaUrl && <a className="rounded-full bg-ink px-3.5 py-1 text-[0.8rem] font-semibold text-paper hover:bg-clay" href={r.oaUrl} target="_blank" rel="noopener noreferrer">Read free full text</a>}
          <a className={chip} href={r.url} target="_blank" rel="noopener noreferrer">{r.doi ? "Publisher page (DOI)" : "Source record"}</a>
          <button type="button" className={chip} onClick={() => copy("cite", cite(r))}>{copied === "cite" ? "Citation copied" : "Copy citation"}</button>
          <button type="button" className={chip} onClick={() => copy("link", r.url)}>{copied === "link" ? "Link copied" : "Share link"}</button>
          <span className="ml-auto text-[0.75rem] text-muted">Found in {r.sources.map((s) => NAMES[s]).join(", ")}</span>
        </div>
      </article>
    </li>
  );
}

export function Results({ q, hidden = {} }: { q: string; hidden?: Record<string, string> }) {
  const sp = useSearchParams();
  const path = usePathname();
  const f = useMemo(() => ({
    sort: sp.get("sort") || "relevance", oa: sp.get("oa") === "1", from: sp.get("from") || "", to: sp.get("to") || "",
    author: sp.get("author") || "", journal: sp.get("journal") || "", page: Math.max(1, Number(sp.get("page")) || 1),
  }), [sp]);
  const [data, setData] = useState<Data | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (!q) return;
    const u = new URLSearchParams({ q, sort: f.sort, page: String(f.page) });
    if (f.oa) u.set("oa", "1");
    for (const k of ["from", "to", "author", "journal"] as const) if (f[k]) u.set(k, f[k]);
    const ctl = new AbortController();
    setState("loading");
    fetch(`/api/search?${u}`, { signal: ctl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: Data) => { setData(d); setState("idle"); })
      .catch((e) => { if (e?.name !== "AbortError") setState("error"); });
    return () => ctl.abort();
  }, [q, f]);

  const pageHref = (page: number) => {
    const u = new URLSearchParams(sp.toString());
    u.set("page", String(page));
    return `${path}?${u}`;
  };
  const activeFilters = [f.oa, f.from, f.to, f.author, f.journal].filter(Boolean).length;
  const live = data?.sources.filter((s) => s.ok) || [];

  return (
    <div className="grid gap-10 lg:grid-cols-[17rem_1fr]">
      <aside>
        <button type="button" className="btn btn-line w-full justify-center lg:hidden" aria-expanded={showFilters} aria-controls="filters" onClick={() => setShowFilters(!showFilters)}>
          {showFilters ? "Hide filters" : `Refine results${activeFilters ? ` (${activeFilters})` : ""}`}
        </button>
        <form id="filters" action={path} className={`${showFilters ? "mt-6 block" : "hidden"} space-y-5 lg:sticky lg:top-28 lg:mt-0 lg:block`}>
          {Object.entries({ q, ...hidden }).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 className="label text-muted">Refine</h2>
          <div>
            <label htmlFor="f-sort" className="mb-1.5 block text-sm font-semibold">Sort by</label>
            <select id="f-sort" name="sort" defaultValue={f.sort} key={f.sort} className="field">
              <option value="relevance">Relevance</option>
              <option value="cited">Most cited</option>
              <option value="newest">Newest first</option>
            </select>
          </div>
          <div>
            <label htmlFor="f-author" className="mb-1.5 block text-sm font-semibold">Author</label>
            <input id="f-author" name="author" defaultValue={f.author} key={f.author} className="field" placeholder="Surname or full name" />
          </div>
          <div>
            <label htmlFor="f-journal" className="mb-1.5 block text-sm font-semibold">Journal</label>
            <input id="f-journal" name="journal" defaultValue={f.journal} key={f.journal} className="field" placeholder="Journal name" />
          </div>
          <fieldset>
            <legend className="mb-1.5 block text-sm font-semibold">Year published</legend>
            <div className="flex items-center gap-2">
              <input aria-label="From year" name="from" type="number" min={1800} max={2100} defaultValue={f.from} key={`a${f.from}`} className="field" placeholder="From" />
              <span aria-hidden>to</span>
              <input aria-label="To year" name="to" type="number" min={1800} max={2100} defaultValue={f.to} key={`b${f.to}`} className="field" placeholder="To" />
            </div>
          </fieldset>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="oa" value="1" defaultChecked={f.oa} key={String(f.oa)} className="h-4 w-4 accent-[var(--color-clay)]" />
            Free full text only
          </label>
          <div className="flex gap-2 pt-1">
            <button className="btn btn-clay flex-1 justify-center">Apply</button>
            {activeFilters > 0 && <Link href={`${path}?${new URLSearchParams({ q, ...hidden })}`} className="btn btn-line">Clear</Link>}
          </div>
        </form>
      </aside>

      <section aria-live="polite" aria-busy={state === "loading"}>
        {state === "loading" && !data && (
          <div>
            <p className="label text-muted">Asking the open databases…</p>
            <ul className="mt-4">{[0, 1, 2, 3].map((i) => (
              <li key={i} className="border-t border-ink/15 py-7"><div className="h-3 w-32 rounded bg-ink/10" /><div className="mt-3 h-6 w-4/5 rounded bg-ink/10" /><div className="mt-3 h-4 w-2/5 rounded bg-ink/10" /><div className="mt-4 h-14 w-full max-w-3xl rounded bg-ink/5" /></li>
            ))}</ul>
          </div>
        )}
        {state === "error" && (
          <div className="rounded-2xl border border-clay/40 bg-clay/5 p-6">
            <p className="font-semibold">The databases could not be reached just now.</p>
            <p className="mt-1 text-ink/75">This is usually temporary. Reload the page to try again.</p>
          </div>
        )}
        {data && state !== "error" && live.length === 0 && (
          <div className="rounded-2xl border border-clay/40 bg-clay/5 p-6">
            <p className="font-semibold">None of the databases answered just now.</p>
            <p className="mt-1 text-ink/75">This is usually temporary. Reload the page to try again.</p>
          </div>
        )}
        {data && state !== "error" && live.length > 0 && (
          <div className={state === "loading" ? "opacity-50" : ""}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <p className="text-[0.95rem]">
                {data.total > 0 ? <>About <strong>{fmt(data.total)}</strong> matching records in the largest source.</> : null}{" "}
                Showing {data.results.length} merged results, page {f.page}.
              </p>
              <p className="text-[0.8rem] text-muted">
                Answered by {live.map((s) => `${NAMES[s.id]}${s.total ? ` (${fmt(s.total)})` : ""}`).join(" · ") || "no source"}
              </p>
            </div>
            {data.results.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-ink/15 p-8">
                <p className="font-display text-2xl">Nothing matched that search.</p>
                <p className="mt-2 text-ink/75">Try fewer words, check the spelling, or clear the filters.</p>
              </div>
            ) : (
              <ul className="mt-6">{data.results.map((r) => <Card key={r.key} r={r} />)}</ul>
            )}
            <nav aria-label="Result pages" className="flex items-center justify-between border-t border-ink/15 pt-6">
              {f.page > 1 ? <Link className="btn btn-line" href={pageHref(f.page - 1)}>← Previous</Link> : <span />}
              {data.results.length >= 8 && f.page < 50 ? <Link className="btn btn-line" href={pageHref(f.page + 1)}>Next page →</Link> : <span />}
            </nav>
          </div>
        )}
      </section>
    </div>
  );
}
