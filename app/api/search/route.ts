import { NextRequest, NextResponse } from "next/server";
import { federatedSearch, type Query } from "@/lib/sources";

export const runtime = "nodejs";
export const maxDuration = 20;

export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const q = (p.get("q") || "").trim().slice(0, 200);
  if (!q) return NextResponse.json({ error: "Enter a search term." }, { status: 400 });
  const year = (v: string | null) => { const n = Number(v); return n >= 1800 && n <= 2100 ? Math.floor(n) : undefined; };
  const sort = p.get("sort");
  const query: Query = {
    q,
    page: Math.min(Math.max(Number(p.get("page")) || 1, 1), 50),
    sort: sort === "cited" || sort === "newest" ? sort : "relevance",
    oa: p.get("oa") === "1",
    from: year(p.get("from")),
    to: year(p.get("to")),
    author: (p.get("author") || "").trim().slice(0, 80) || undefined,
    journal: (p.get("journal") || "").trim().slice(0, 120) || undefined,
  };
  try {
    const data = await federatedSearch(query);
    return NextResponse.json(data, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return NextResponse.json({ error: "The databases could not be reached. Please try again." }, { status: 502 });
  }
}
