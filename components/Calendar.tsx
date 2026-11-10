"use client";
import { useMemo, useState } from "react";
import type { Course } from "@/lib/courses";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const ym = (y: number, m: number) => `${y}-${String(m + 1).padStart(2, "0")}`;

export function Calendar({ courses, start }: { courses: Course[]; start: string }) {
  const [y0, m0] = start.split("-").map(Number);
  const [cur, setCur] = useState({ y: y0, m: m0 - 1 });
  const [picked, setPicked] = useState<string | null>(null);
  const move = (d: number) => setCur(({ y, m }) => { const n = new Date(Date.UTC(y, m + d, 1)); return { y: n.getUTCFullYear(), m: n.getUTCMonth() }; });
  const cells = useMemo(() => {
    const first = new Date(Date.UTC(cur.y, cur.m, 1));
    const lead = (first.getUTCDay() + 6) % 7;
    const days = new Date(Date.UTC(cur.y, cur.m + 1, 0)).getUTCDate();
    return [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)] as (number | null)[];
  }, [cur]);
  const month = new Date(Date.UTC(cur.y, cur.m, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" });
  const inMonth = courses.filter((c) => c.date.startsWith(ym(cur.y, cur.m)));
  const months = [...new Set(courses.map((c) => c.date.slice(0, 7)))];

  return (
    <div className="on-ink rounded-3xl bg-ink p-5 text-paper md:p-8">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => move(-1)} aria-label="Previous month" className="grid h-10 w-10 place-items-center rounded-full border border-paper/25 hover:border-ochre hover:text-ochre">←</button>
        <h3 className="font-display text-2xl" aria-live="polite">{month}</h3>
        <button type="button" onClick={() => move(1)} aria-label="Next month" className="grid h-10 w-10 place-items-center rounded-full border border-paper/25 hover:border-ochre hover:text-ochre">→</button>
      </div>
      <div className="mt-6 grid grid-cols-7 gap-1 text-center" role="grid" aria-label={month}>
        {DOW.map((d) => <div key={d} role="columnheader" className="label pb-2 text-paper/45">{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const iso = `${ym(cur.y, cur.m)}-${String(d).padStart(2, "0")}`;
          const c = courses.find((x) => x.date === iso);
          return c ? (
            <button key={i} type="button" role="gridcell" aria-label={`${d} ${month}: ${c.title}`} aria-pressed={picked === c.id} onClick={() => { setPicked(c.id); document.getElementById(`course-${c.id}`)?.scrollIntoView({ behavior: "smooth", block: "center" }); }}
              className="grid aspect-square place-items-center rounded-full bg-clay font-semibold text-paper ring-ochre ring-offset-2 ring-offset-ink hover:ring-2">{d}</button>
          ) : (
            <div key={i} role="gridcell" className="grid aspect-square place-items-center rounded-full text-paper/70">{d}</div>
          );
        })}
      </div>
      <p className="mt-5 min-h-[2.75rem] border-t border-paper/15 pt-4 text-sm text-paper/75">
        {inMonth.length ? inMonth.map((c) => <span key={c.id} className="block"><span className="text-ochre">{Number(c.date.slice(8))}</span> · {c.title}</span>) : "No courses this month."}
      </p>
      {months.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {months.map((mm) => { const [yy, mo] = mm.split("-").map(Number); const on = yy === cur.y && mo - 1 === cur.m;
            return <button key={mm} type="button" onClick={() => setCur({ y: yy, m: mo - 1 })} className={`rounded-full border px-3 py-1 text-[0.8rem] ${on ? "border-ochre text-ochre" : "border-paper/25 text-paper/75 hover:border-paper"}`}>{new Date(Date.UTC(yy, mo - 1, 1)).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" })}</button>; })}
        </div>
      )}
    </div>
  );
}
