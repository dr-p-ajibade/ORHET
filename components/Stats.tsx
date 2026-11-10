import { collectionStats } from "@/lib/sources";
import { fmt } from "@/lib/format";

export async function Stats() {
  const { stats, headline } = await collectionStats();
  return (
    <section className="on-ink relative overflow-hidden bg-ink text-paper" aria-labelledby="stats-h">
      <div aria-hidden className="lines-arc absolute inset-0 opacity-[0.06]" />
      <div className="wrap relative py-20 md:py-28">
        <p className="label text-ochre">The size of the open record</p>
        <p id="stats-h" className="display mt-5 text-[13vw] leading-none sm:text-7xl md:text-8xl lg:text-9xl" data-reveal>
          {fmt(headline.count)}{headline.live ? "" : "+"}
        </p>
        <p className="mt-6 max-w-2xl text-lg text-paper/75">
          research works searchable through ORHET today, counted in {headline.name}, the largest of the open databases we query. The other sources add full texts, citation links and persistent identifiers to the same body of work.
        </p>
        <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-paper/15 md:grid-cols-4">
          {stats.map((s) => (
            <div key={s.id} className="bg-ink p-6">
              <dt className="label text-paper/55">{s.name}</dt>
              <dd className="mt-2 font-display text-2xl md:text-3xl">{s.live ? "" : "about "}{fmt(s.count)}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 max-w-3xl text-sm text-paper/50">
          Figures are read from each database once a day. The databases overlap, so the same article is often counted in several of them. For that reason ORHET does not add the totals together.
        </p>
      </div>
    </section>
  );
}
