// Federated search across open scholarly databases. Every record shown on ORHET
// comes from one of these calls. Nothing is stored and nothing is invented.

export type SourceId = "openalex" | "crossref" | "europepmc" | "doaj" | "semanticscholar" | "arxiv" | "core";

export const SOURCES: { id: SourceId; name: string; note: string; url: string }[] = [
  { id: "openalex", name: "OpenAlex", note: "Open catalogue of the global research system", url: "https://openalex.org" },
  { id: "crossref", name: "Crossref", note: "The DOI registry for scholarly works", url: "https://www.crossref.org" },
  { id: "core", name: "CORE", note: "Full text from open repositories worldwide", url: "https://core.ac.uk" },
  { id: "semanticscholar", name: "Semantic Scholar", note: "Citation graph and relevance ranking", url: "https://www.semanticscholar.org" },
  { id: "europepmc", name: "Europe PMC", note: "Life sciences literature and preprints", url: "https://europepmc.org" },
  { id: "doaj", name: "DOAJ", note: "Vetted open access journals", url: "https://doaj.org" },
  { id: "arxiv", name: "arXiv", note: "Preprints", url: "https://arxiv.org" },
];

export type Rec = {
  key: string;
  title: string;
  authors: string[];
  year?: number;
  journal?: string;
  volume?: string;
  issue?: string;
  doi?: string;
  url: string;
  oaUrl?: string;
  abstract?: string;
  citations?: number;
  type?: string;
  sources: SourceId[];
};

export type Query = {
  q: string;
  page: number;
  sort: "relevance" | "cited" | "newest";
  oa: boolean;
  from?: number;
  to?: number;
  author?: string;
  journal?: string;
};

export type SourceReport = { id: SourceId; ok: boolean; total?: number; count: number; skipped?: string };

const MAIL = process.env.CONTACT_EMAIL || "info@orhet.com";
const UA = `ORHET/1.0 (https://orhet.proxxymedia.com; mailto:${MAIL})`;
const PER = 12;

async function get(url: string, init: RequestInit = {}, ms = 7000, revalidate = 3600): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: { "User-Agent": UA, Accept: "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(ms),
    next: { revalidate },
  } as RequestInit);
  if (!res.ok) throw new Error(`${res.status} ${url.split("?")[0]}`);
  return res;
}

const clean = (s?: string | null) =>
  (s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, " ").trim();
const normDoi = (d?: string | null) => (d ? d.toLowerCase().replace(/^https?:\/\/(dx\.)?doi\.org\//, "").replace(/^doi:/, "").trim() : undefined);
const normTitle = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim().slice(0, 140);
const num = (v: unknown) => (typeof v === "number" && isFinite(v) ? v : typeof v === "string" && /^\d+$/.test(v) ? Number(v) : undefined);

function rec(p: Partial<Rec> & { title: string; url: string }, source: SourceId): Rec | null {
  const title = clean(p.title);
  if (!title) return null;
  const doi = normDoi(p.doi);
  return {
    key: doi ? `doi:${doi}` : `t:${normTitle(title)}`,
    title,
    authors: (p.authors || []).map((a) => clean(a)).filter(Boolean),
    year: p.year,
    journal: clean(p.journal) || undefined,
    volume: p.volume ? String(p.volume) : undefined,
    issue: p.issue ? String(p.issue) : undefined,
    doi,
    url: doi ? `https://doi.org/${doi}` : p.url,
    oaUrl: p.oaUrl || undefined,
    abstract: clean(p.abstract) || undefined,
    citations: p.citations,
    type: p.type,
    sources: [source],
  };
}

type Out = { total?: number; items: Rec[] };
const terms = (qy: Query) => [qy.q, qy.author, qy.journal].filter(Boolean).join(" ");

function invert(idx?: Record<string, number[]> | null) {
  if (!idx) return undefined;
  const words: string[] = [];
  for (const [w, pos] of Object.entries(idx)) for (const p of pos) words[p] = w;
  return words.join(" ");
}

async function openalex(qy: Query): Promise<Out> {
  const f: string[] = [];
  if (qy.oa) f.push("is_oa:true");
  if (qy.from) f.push(`from_publication_date:${qy.from}-01-01`);
  if (qy.to) f.push(`to_publication_date:${qy.to}-12-31`);
  const u = new URLSearchParams({ search: terms(qy), "per-page": String(PER), page: String(qy.page), mailto: MAIL });
  if (f.length) u.set("filter", f.join(","));
  if (qy.sort === "cited") u.set("sort", "cited_by_count:desc");
  if (qy.sort === "newest") u.set("sort", "publication_date:desc");
  if (process.env.OPENALEX_API_KEY) u.set("api_key", process.env.OPENALEX_API_KEY);
  const j = await (await get(`https://api.openalex.org/works?${u}`)).json();
  const items = (j.results || []).map((w: any) =>
    rec({
      title: w.title || w.display_name,
      authors: (w.authorships || []).map((a: any) => a?.author?.display_name),
      year: num(w.publication_year),
      journal: w.primary_location?.source?.display_name,
      volume: w.biblio?.volume, issue: w.biblio?.issue,
      doi: w.doi, url: w.id,
      oaUrl: w.open_access?.oa_url || w.best_oa_location?.pdf_url || undefined,
      abstract: invert(w.abstract_inverted_index),
      citations: num(w.cited_by_count), type: w.type,
    }, "openalex"));
  return { total: num(j.meta?.count), items: items.filter(Boolean) };
}

async function crossref(qy: Query): Promise<Out> {
  const u = new URLSearchParams({ query: qy.q, rows: String(PER), offset: String((qy.page - 1) * PER), mailto: MAIL,
    select: "DOI,title,author,container-title,volume,issue,issued,is-referenced-by-count,URL,type,abstract" });
  if (qy.author) u.set("query.author", qy.author);
  if (qy.journal) u.set("query.container-title", qy.journal);
  const f: string[] = [];
  if (qy.from) f.push(`from-pub-date:${qy.from}`);
  if (qy.to) f.push(`until-pub-date:${qy.to}`);
  if (f.length) u.set("filter", f.join(","));
  if (qy.sort === "cited") { u.set("sort", "is-referenced-by-count"); u.set("order", "desc"); }
  if (qy.sort === "newest") { u.set("sort", "published"); u.set("order", "desc"); }
  const j = await (await get(`https://api.crossref.org/works?${u}`)).json();
  const items = (j.message?.items || []).map((w: any) =>
    rec({
      title: w.title?.[0] || "",
      authors: (w.author || []).map((a: any) => [a.given, a.family].filter(Boolean).join(" ") || a.name),
      year: num(w.issued?.["date-parts"]?.[0]?.[0]),
      journal: w["container-title"]?.[0], volume: w.volume, issue: w.issue,
      doi: w.DOI, url: w.URL, abstract: w.abstract,
      citations: num(w["is-referenced-by-count"]), type: w.type,
    }, "crossref"));
  return { total: num(j.message?.["total-results"]), items: items.filter(Boolean) };
}

async function europepmc(qy: Query): Promise<Out> {
  let query = qy.q;
  if (qy.author) query += ` AND AUTH:"${qy.author}"`;
  if (qy.journal) query += ` AND JOURNAL:"${qy.journal}"`;
  if (qy.oa) query += " AND OPEN_ACCESS:y";
  if (qy.from || qy.to) query += ` AND PUB_YEAR:[${qy.from || 1900} TO ${qy.to || 2100}]`;
  const u = new URLSearchParams({ query, format: "json", pageSize: "8", resultType: "core", page: String(qy.page) });
  if (qy.sort === "cited") u.set("sort", "CITED desc");
  if (qy.sort === "newest") u.set("sort", "P_PDATE_D desc");
  const j = await (await get(`https://www.ebi.ac.uk/europepmc/webservices/rest/search?${u}`)).json();
  const items = (j.resultList?.result || []).map((w: any) =>
    rec({
      title: w.title || "",
      authors: (w.authorString || "").replace(/\.$/, "").split(", ").filter(Boolean),
      year: num(w.pubYear),
      journal: w.journalInfo?.journal?.title || w.bookOrReportDetails?.publisher,
      volume: w.journalInfo?.volume, issue: w.journalInfo?.issue,
      doi: w.doi, url: `https://europepmc.org/article/${w.source}/${w.id}`,
      oaUrl: w.isOpenAccess === "Y" ? (w.fullTextUrlList?.fullTextUrl?.[0]?.url || `https://europepmc.org/article/${w.source}/${w.id}`) : undefined,
      abstract: w.abstractText, citations: num(w.citedByCount), type: w.pubTypeList?.pubType?.[0],
    }, "europepmc"));
  return { total: num(j.hitCount), items: items.filter(Boolean) };
}

async function doaj(qy: Query): Promise<Out> {
  const u = new URLSearchParams({ page: String(qy.page), pageSize: "8" });
  const j = await (await get(`https://doaj.org/api/search/articles/${encodeURIComponent(terms(qy))}?${u}`)).json();
  const items = (j.results || []).map((r: any) => {
    const b = r.bibjson || {};
    const link = (b.link || []).find((l: any) => l.type === "fulltext")?.url || (b.link || [])[0]?.url;
    return rec({
      title: b.title || "", authors: (b.author || []).map((a: any) => a.name),
      year: num(b.year), journal: b.journal?.title, volume: b.journal?.volume, issue: b.journal?.number,
      doi: (b.identifier || []).find((i: any) => String(i.type).toLowerCase() === "doi")?.id,
      url: link || `https://doaj.org/article/${r.id}`, oaUrl: link || `https://doaj.org/article/${r.id}`,
      abstract: b.abstract, type: "article",
    }, "doaj");
  });
  return { total: num(j.total), items: items.filter(Boolean) };
}

async function semanticscholar(qy: Query): Promise<Out> {
  const u = new URLSearchParams({ query: terms(qy), limit: "8", offset: String((qy.page - 1) * 8),
    fields: "title,authors,year,venue,externalIds,citationCount,openAccessPdf,abstract,url,publicationTypes" });
  if (qy.from || qy.to) u.set("year", `${qy.from || ""}-${qy.to || ""}`);
  if (qy.oa) u.set("openAccessPdf", "");
  const headers: Record<string, string> = {};
  if (process.env.SEMANTIC_SCHOLAR_API_KEY) headers["x-api-key"] = process.env.SEMANTIC_SCHOLAR_API_KEY;
  const j = await (await get(`https://api.semanticscholar.org/graph/v1/paper/search?${u}`, { headers }, 5000)).json();
  const items = (j.data || []).map((w: any) =>
    rec({
      title: w.title || "", authors: (w.authors || []).map((a: any) => a.name),
      year: num(w.year), journal: w.venue, doi: w.externalIds?.DOI, url: w.url,
      oaUrl: w.openAccessPdf?.url || undefined, abstract: w.abstract,
      citations: num(w.citationCount), type: w.publicationTypes?.[0],
    }, "semanticscholar"));
  return { total: num(j.total), items: items.filter(Boolean) };
}

async function arxiv(qy: Query): Promise<Out> {
  const u = new URLSearchParams({ search_query: `all:${terms(qy)}`, start: String((qy.page - 1) * 5), max_results: "5" });
  if (qy.sort === "newest") { u.set("sortBy", "submittedDate"); u.set("sortOrder", "descending"); }
  const xml = await (await get(`https://export.arxiv.org/api/query?${u}`, { headers: { Accept: "application/atom+xml" } }, 5000)).text();
  const tag = (s: string, t: string) => s.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1];
  const items = xml.split("<entry>").slice(1).map((e) => {
    const id = clean(tag(e, "id"));
    return rec({
      title: tag(e, "title") || "",
      authors: [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1]),
      year: num((tag(e, "published") || "").slice(0, 4)),
      journal: "arXiv preprint", doi: tag(e, "arxiv:doi"), url: id, oaUrl: id.replace("/abs/", "/pdf/"),
      abstract: tag(e, "summary"), type: "preprint",
    }, "arxiv");
  });
  return { total: num(tag(xml, "opensearch:totalResults")), items: items.filter(Boolean) as Rec[] };
}

async function core(qy: Query): Promise<Out> {
  const u = new URLSearchParams({ q: terms(qy), limit: "8", offset: String((qy.page - 1) * 8) });
  const j = await (await get(`https://api.core.ac.uk/v3/search/works?${u}`, { headers: { Authorization: `Bearer ${process.env.CORE_API_KEY}` } })).json();
  const items = (j.results || []).map((w: any) =>
    rec({
      title: w.title || "", authors: (w.authors || []).map((a: any) => a.name),
      year: num(w.yearPublished), journal: w.journals?.[0]?.title || w.publisher,
      doi: w.doi, url: w.links?.find((l: any) => l.type === "display")?.url || `https://core.ac.uk/works/${w.id}`,
      oaUrl: w.downloadUrl || undefined, abstract: w.abstract, citations: num(w.citationCount), type: w.documentType,
    }, "core"));
  return { total: num(j.totalHits), items: items.filter(Boolean) };
}

const RUNNERS: Record<SourceId, (q: Query) => Promise<Out>> = { openalex, crossref, europepmc, doaj, semanticscholar, arxiv, core };

async function unpaywall(doi: string): Promise<string | undefined> {
  try {
    const j = await (await get(`https://api.unpaywall.org/v2/${encodeURIComponent(doi)}?email=${encodeURIComponent(MAIL)}`, {}, 2500, 86400)).json();
    return j.best_oa_location?.url_for_pdf || j.best_oa_location?.url || undefined;
  } catch {
    return undefined;
  }
}

export async function federatedSearch(qy: Query): Promise<{ results: Rec[]; sources: SourceReport[]; total: number }> {
  const ids = SOURCES.map((s) => s.id);
  const settled = await Promise.all(
    ids.map(async (id): Promise<SourceReport & { items: Rec[] }> => {
      if (id === "core" && !process.env.CORE_API_KEY) return { id, ok: false, count: 0, items: [], skipped: "no key" };
      try {
        const out = await RUNNERS[id](qy);
        return { id, ok: true, total: out.total, count: out.items.length, items: out.items };
      } catch {
        return { id, ok: false, count: 0, items: [] };
      }
    }),
  );

  // Merge duplicates by DOI, then by title. Rank by reciprocal rank fusion.
  const merged = new Map<string, Rec & { score: number }>();
  const byTitle = new Map<string, string>();
  for (const s of settled) {
    s.items.forEach((r, i) => {
      const tKey = normTitle(r.title);
      const key = merged.has(r.key) ? r.key : byTitle.get(tKey) || r.key;
      const score = 1 / (20 + i);
      const cur = merged.get(key);
      if (!cur) {
        merged.set(key, { ...r, score });
        byTitle.set(tKey, key);
        return;
      }
      cur.score += score;
      cur.sources = [...new Set([...cur.sources, ...r.sources])];
      if (!cur.doi && r.doi) { cur.doi = r.doi; cur.url = r.url; }
      cur.oaUrl ||= r.oaUrl;
      cur.journal ||= r.journal; cur.volume ||= r.volume; cur.issue ||= r.issue; cur.year ||= r.year; cur.type ||= r.type;
      if ((r.abstract?.length || 0) > (cur.abstract?.length || 0)) cur.abstract = r.abstract;
      if ((r.citations || 0) > (cur.citations || 0)) cur.citations = r.citations;
      if (r.authors.length > cur.authors.length) cur.authors = r.authors;
    });
  }

  let list = [...merged.values()];
  const has = (hay: string | undefined, needle: string) => (hay || "").toLowerCase().includes(needle.toLowerCase());
  if (qy.author) { const last = qy.author.trim().split(/\s+/).pop()!; list = list.filter((r) => r.authors.some((a) => has(a, last))); }
  if (qy.journal) list = list.filter((r) => has(r.journal, qy.journal!));
  if (qy.from) list = list.filter((r) => !r.year || r.year >= qy.from!);
  if (qy.to) list = list.filter((r) => !r.year || r.year <= qy.to!);

  // Ask Unpaywall for a free copy where a DOI exists and no open link is known yet.
  const need = list.filter((r) => r.doi && !r.oaUrl).slice(0, 8);
  await Promise.all(need.map(async (r) => { r.oaUrl = await unpaywall(r.doi!); }));
  if (qy.oa) list = list.filter((r) => r.oaUrl);

  if (qy.sort === "cited") list.sort((a, b) => (b.citations || 0) - (a.citations || 0));
  else if (qy.sort === "newest") list.sort((a, b) => (b.year || 0) - (a.year || 0));
  else list.sort((a, b) => b.score - a.score);

  const results = list.map(({ score, ...r }) => ({ ...r, abstract: r.abstract ? r.abstract.slice(0, 900) : undefined, authors: r.authors.slice(0, 12) }));
  const sources = settled.map(({ items, ...s }) => s);
  const total = Math.max(0, ...sources.map((s) => s.total || 0));
  return { results, sources, total };
}

// ---------- Collection size ----------

export type Stat = { id: SourceId; name: string; count: number; live: boolean };
// Used only when a source cannot be reached. Shown as "about".
const FALLBACK: Partial<Record<SourceId, number>> = { openalex: 250_000_000, crossref: 150_000_000, europepmc: 40_000_000, doaj: 10_000_000 };

async function count(id: SourceId): Promise<number | undefined> {
  const day = 86400;
  try {
    if (id === "openalex") {
      const key = process.env.OPENALEX_API_KEY ? `&api_key=${process.env.OPENALEX_API_KEY}` : "";
      return num((await (await get(`https://api.openalex.org/works?per-page=1&select=id&mailto=${MAIL}${key}`, {}, 6000, day)).json()).meta?.count);
    }
    if (id === "crossref") return num((await (await get(`https://api.crossref.org/works?rows=0&mailto=${MAIL}`, {}, 6000, day)).json()).message?.["total-results"]);
    if (id === "europepmc") return num((await (await get("https://www.ebi.ac.uk/europepmc/webservices/rest/search?query=*&format=json&pageSize=1&resultType=idlist", {}, 6000, day)).json()).hitCount);
    if (id === "doaj") return num((await (await get("https://doaj.org/api/search/articles/*?pageSize=1", {}, 6000, day)).json()).total);
  } catch {}
  return undefined;
}

export async function collectionStats(): Promise<{ stats: Stat[]; headline: Stat; allLive: boolean }> {
  const ids: SourceId[] = ["openalex", "crossref", "europepmc", "doaj"];
  const stats = await Promise.all(ids.map(async (id) => {
    const c = await count(id);
    return { id, name: SOURCES.find((s) => s.id === id)!.name, count: c ?? FALLBACK[id]!, live: c !== undefined };
  }));
  const headline = [...stats].sort((a, b) => b.count - a.count)[0];
  return { stats, headline, allLive: stats.every((s) => s.live) };
}

export async function themeCount(q: string): Promise<number | undefined> {
  try {
    const key = process.env.OPENALEX_API_KEY ? `&api_key=${process.env.OPENALEX_API_KEY}` : "";
    return num((await (await get(`https://api.openalex.org/works?search=${encodeURIComponent(q)}&per-page=1&select=id&mailto=${MAIL}${key}`, {}, 6000, 86400)).json()).meta?.count);
  } catch {
    return undefined;
  }
}
